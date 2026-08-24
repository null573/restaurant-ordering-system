import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import type { TenantDB } from '../db/client';
import { generateId } from '../utils/id';
import { ok, fail } from '../utils/response';
import { wechatPayCreateOrder } from '../services/wechat-pay';

export const subscriptionRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

/**
 * GET /api/subscription/status - 查询订阅状态
 */
subscriptionRoutes.get('/status', async (c) => {
  const tenantId = c.get('tenantId');

  const tenant = await c.env.DB.prepare(
    `SELECT name, status, trial_started_at, trial_days, plan_price_fen, plan_cycle_days, paid_until
     FROM tenants WHERE id = ?`
  ).bind(tenantId).first<{
    name: string; status: string; trial_started_at: string | null;
    trial_days: number; plan_price_fen: number; plan_cycle_days: number;
    paid_until: string | null;
  }>();

  if (!tenant) return c.json(fail('租户不存在'), 404);

  const now = new Date();
  const trialEnd = tenant.trial_started_at
    ? new Date(new Date(tenant.trial_started_at).getTime() + tenant.trial_days * 86400000)
    : null;

  const paidUntil = tenant.paid_until ? new Date(tenant.paid_until) : null;
  const isActive = tenant.status === 'active' && paidUntil && paidUntil > now;
  const isTrial = tenant.status === 'trial' && trialEnd && trialEnd > now;

  const remainingDays = isActive && paidUntil
    ? Math.ceil((paidUntil.getTime() - now.getTime()) / 86400000)
    : isTrial && trialEnd
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
      : 0;

  return c.json(ok({
    status: tenant.status,
    trialStartedAt: tenant.trial_started_at,
    trialDays: tenant.trial_days,
    trialEndAt: trialEnd?.toISOString() || null,
    planPriceFen: tenant.plan_price_fen,
    planCycleDays: tenant.plan_cycle_days,
    paidUntil: tenant.paid_until,
    remainingDays,
    isTrial: !!isTrial,
    isActive: !!isActive,
  }));
});

/**
 * POST /api/subscription/pay - 生成订阅支付 (Native 扫码)
 */
subscriptionRoutes.post('/pay', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json<{ cycleDays?: number }>();

  const tenant = await c.env.DB.prepare(
    'SELECT name, wechat_appid, wechat_mchid, plan_price_fen, plan_cycle_days FROM tenants WHERE id = ?'
  ).bind(tenantId).first<{
    name: string; wechat_appid: string | null; wechat_mchid: string | null;
    plan_price_fen: number; plan_cycle_days: number;
  }>();

  if (!tenant) return c.json(fail('租户不存在'), 404);
  if (!tenant.wechat_appid || !tenant.wechat_mchid) {
    return c.json(fail('请先在系统设置中配置微信支付信息'), 400);
  }

  const cycleDays = body.cycleDays || tenant.plan_cycle_days;
  const amount = tenant.plan_price_fen;
  const outTradeNo = `sub-${generateId()}`;
  const now = new Date().toISOString();

  // 创建支付记录
  const paymentId = generateId('sub');
  await c.env.DB.prepare(
    `INSERT INTO subscription_payments (id, tenant_id, out_trade_no, amount_fen, cycle_days, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'unpaid', ?)`
  ).bind(paymentId, tenantId, outTradeNo, amount, cycleDays, now).run();

  // 调用微信 Native 支付
  const notifyUrl = `${c.env.APP_BASE_URL}/api/webhook/wechat-pay`;

  try {
    const result = await wechatPayCreateOrder(c.env, {
      mchid: tenant.wechat_mchid,
      appid: tenant.wechat_appid,
      description: `餐厅系统订阅-${tenant.name}`,
      outTradeNo,
      amountFen: amount,
      notifyUrl,
      scene: 'NATIVE',
    });

    return c.json(ok({
      paymentId,
      outTradeNo,
      amountFen: amount,
      cycleDays,
      codeUrl: result.codeUrl,
    }));
  } catch (e: any) {
    return c.json(fail(e.message || '支付创建失败'), 500);
  }
});

/**
 * GET /api/subscription/settings - 获取订阅设置
 */
subscriptionRoutes.get('/settings', async (c) => {
  const tenantId = c.get('tenantId');

  const tenant = await c.env.DB.prepare(
    `SELECT trial_days, plan_price_fen, plan_cycle_days, wechat_appid, wechat_mchid FROM tenants WHERE id = ?`
  ).bind(tenantId).first();

  return c.json(ok(tenant));
});

/**
 * PUT /api/subscription/settings - 修改订阅设置 (owner 权限)
 */
subscriptionRoutes.put('/settings', async (c) => {
  const role = c.get('role');
  if (role !== 'owner') return c.json(fail('仅 owner 可修改'), 403);

  const tenantId = c.get('tenantId');
  const body = await c.req.json<{
    trialDays?: number;
    planPriceFen?: number;
    planCycleDays?: number;
    wechatAppid?: string;
    wechatMchid?: string;
  }>();

  const updates: Record<string, unknown> = {};
  if (body.trialDays !== undefined) updates.trial_days = body.trialDays;
  if (body.planPriceFen !== undefined) updates.plan_price_fen = body.planPriceFen;
  if (body.planCycleDays !== undefined) updates.plan_cycle_days = body.planCycleDays;
  if (body.wechatAppid !== undefined) updates.wechat_appid = body.wechatAppid;
  if (body.wechatMchid !== undefined) updates.wechat_mchid = body.wechatMchid;
  updates.updated_at = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE tenants SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE id = ?`
  ).bind(...Object.values(updates), tenantId).run();

  // 清缓存
  await c.env.KV.delete(`tenant:status:${tenantId}`);

  return c.json(ok(null, '设置已更新'));
});

/**
 * GET /api/subscription/payments - 支付记录
 */
subscriptionRoutes.get('/payments', async (c) => {
  const tenantId = c.get('tenantId');
  const results = await c.env.DB.prepare(
    `SELECT id, out_trade_no, amount_fen, cycle_days, status, wechat_trade_no, paid_at, created_at
     FROM subscription_payments WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50`
  ).bind(tenantId).all();

  return c.json(ok(results.results || []));
});
