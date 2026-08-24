import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import type { TenantDB } from '../db/client';
import { generateId, generateShortCode } from '../utils/id';
import { ok, fail } from '../utils/response';
import { wechatPayCreateOrder, verifyWechatCallback } from '../services/wechat-pay';

export const paymentRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

/**
 * GET /api/payment/wechat/jsapi - 顾客微信内结账 (JSAPI 支付)
 * 需要 openid，前端需先完成 OAuth2 网页授权
 */
paymentRoutes.post('/wechat/jsapi', async (c) => {
  const db = c.get('db');
  const tenantId = c.get('tenantId');
  const body = await c.req.json<{ orderId: string; openid: string }>();

  if (!body.orderId || !body.openid) {
    return c.json(fail('订单ID和openid为必填项'), 400);
  }

  // 获取租户微信配置
  const tenant = await c.env.DB.prepare(
    'SELECT wechat_appid, wechat_mchid FROM tenants WHERE id = ?'
  ).bind(tenantId).first<{ wechat_appid: string | null; wechat_mchid: string | null }>();

  if (!tenant?.wechat_appid || !tenant?.wechat_mchid) {
    return c.json(fail('餐厅未配置微信支付'), 400);
  }

  const order = await db.queryOne<{ id: string; total_fen: number; order_no: string; desk_id: string }>(
    'SELECT id, total_fen, order_no, desk_id FROM orders WHERE id = ?', [body.orderId]
  );

  if (!order) return c.json(fail('订单不存在'), 404);

  const outTradeNo = order.order_no;
  const notifyUrl = `${c.env.APP_BASE_URL}/api/webhook/wechat-pay`;

  try {
    const result = await wechatPayCreateOrder(c.env, {
      mchid: tenant.wechat_mchid,
      appid: tenant.wechat_appid,
      description: `餐厅点餐-${order.order_no}`,
      outTradeNo,
      amountFen: order.total_fen,
      notifyUrl,
      openid: body.openid,
      scene: 'JSAPI',
    });

    // 更新订单 settle_type
    await db.update('orders', body.orderId, { settle_type: 'self' });

    return c.json(ok(result));
  } catch (e: any) {
    return c.json(fail(e.message || '微信支付创建失败'), 500);
  }
});

/**
 * POST /api/payment/wechat/h5 - 顾客浏览器结账 (H5 支付)
 */
paymentRoutes.post('/wechat/h5', async (c) => {
  const db = c.get('db');
  const tenantId = c.get('tenantId');
  const body = await c.req.json<{ orderId: string }>();
  const payerIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';

  const tenant = await c.env.DB.prepare(
    'SELECT wechat_appid, wechat_mchid FROM tenants WHERE id = ?'
  ).bind(tenantId).first<{ wechat_appid: string | null; wechat_mchid: string | null }>();

  if (!tenant?.wechat_appid || !tenant?.wechat_mchid) {
    return c.json(fail('餐厅未配置微信支付'), 400);
  }

  const order = await db.queryOne<{ id: string; total_fen: number; order_no: string }>(
    'SELECT id, total_fen, order_no FROM orders WHERE id = ?', [body.orderId]
  );

  if (!order) return c.json(fail('订单不存在'), 404);

  const notifyUrl = `${c.env.APP_BASE_URL}/api/webhook/wechat-pay`;

  try {
    const result = await wechatPayCreateOrder(c.env, {
      mchid: tenant.wechat_mchid,
      appid: tenant.wechat_appid,
      description: `餐厅点餐-${order.order_no}`,
      outTradeNo: order.order_no,
      amountFen: order.total_fen,
      notifyUrl,
      payerIp,
      scene: 'H5',
    });

    await db.update('orders', body.orderId, { settle_type: 'self' });

    return c.json(ok(result));
  } catch (e: any) {
    return c.json(fail(e.message || '微信支付创建失败'), 500);
  }
});

/**
 * POST /api/webhook/wechat-pay - 微信支付回调 (无需鉴权)
 */
paymentRoutes.post('/wechat-pay/webhook', async (c) => {
  const timestamp = c.req.header('Wechatpay-Timestamp') || '';
  const nonce = c.req.header('Wechatpay-Nonce') || '';
  const signature = c.req.header('Wechatpay-Signature') || '';
  const serial = c.req.header('Wechatpay-Serial') || '';
  const body = await c.req.text();

  // 验签
  const valid = await verifyWechatCallback(c.env, timestamp, nonce, body, signature, serial);
  if (!valid) {
    return c.json({ code: 'FAIL', message: '签名验证失败' }, 401);
  }

  const data = JSON.parse(body);
  const resource = JSON.parse(data.resource.ciphertext); // 实际需解密

  const outTradeNo = resource.out_trade_no;
  const tradeNo = resource.transaction_id;
  const tradeState = resource.trade_state;

  // 幂等更新: 只在 unpaid/pending 状态下更新
  if (tradeState === 'SUCCESS') {
    const now = new Date().toISOString();

    // 查找订单
    const order = await c.env.DB.prepare(
      `SELECT id, tenant_id, desk_id FROM orders WHERE order_no = ? AND status = 'pending'`
    ).bind(outTradeNo).first<{ id: string; tenant_id: string; desk_id: string }>();

    if (order) {
      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE orders SET status = 'paid', pay_method = 'wechat', wechat_trade_no = ?, paid_at = ? WHERE id = ? AND status = 'pending'`
        ).bind(tradeNo, now, order.id),
        c.env.DB.prepare(
          `UPDATE desks SET status = 'paying' WHERE tenant_id = ? AND id = ?`
        ).bind(order.tenant_id, order.desk_id),
      ]);

      // 通过 DO 广播支付完成
      const doId = c.env.DESK_ROOM.idFromName(`${order.tenant_id}:${order.desk_id}`);
      const stub = c.env.DESK_ROOM.get(doId);
      await stub.fetch(`https://do-broadcast/broadcast`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'payment:done',
          orderId: order.id,
          payMethod: 'wechat',
        }),
      }).catch(() => {});
    }

    // 订阅支付回调
    const subPayment = await c.env.DB.prepare(
      `SELECT id, tenant_id, cycle_days FROM subscription_payments WHERE out_trade_no = ? AND status = 'unpaid'`
    ).bind(outTradeNo).first<{ id: string; tenant_id: string; cycle_days: number }>();

    if (subPayment) {
      const paidUntilDate = new Date();
      paidUntilDate.setDate(paidUntilDate.getDate() + subPayment.cycle_days);

      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE subscription_payments SET status = 'paid', wechat_trade_no = ?, paid_at = ? WHERE id = ?`
        ).bind(tradeNo, now, subPayment.id),
        c.env.DB.prepare(
          `UPDATE tenants SET status = 'active', paid_until = ? WHERE id = ?`
        ).bind(paidUntilDate.toISOString(), subPayment.tenant_id),
      ]);

      // 清除租户状态缓存
      await c.env.KV.delete(`tenant:status:${subPayment.tenant_id}`);
    }
  }

  return c.json({ code: 'SUCCESS', message: '成功' });
});

/**
 * GET /api/payment/wechat/oauth - 微信 OAuth2 获取 openid (重定向)
 * 顾客在微信内扫码后需要此步骤
 */
paymentRoutes.get('/wechat/oauth', (c) => {
  const tenantId = c.get('tenantId');
  const redirectUri = encodeURIComponent(`${c.env.APP_BASE_URL}/api/payment/wechat/oauth/callback`);
  return c.redirect(
    `https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base#wechat_redirect`
  );
});

/**
 * GET /api/payment/wechat/oauth/callback - OAuth2 回调
 */
paymentRoutes.get('/wechat/oauth/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.json(fail('缺少 code 参数'), 400);

  // 用 code 换 openid (需要租户的 appid 和 secret)
  // 实际部署时需从 tenants 表获取配置
  // 此处为简化流程

  return c.json(ok({ openid: 'placeholder' }));
});
