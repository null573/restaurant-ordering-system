import { Hono } from 'hono';
import type { Env, AppVars } from './types';
import { TenantDB } from './db/client';
import { authMiddleware, requireRole } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler } from './middleware/error';
import { authRoutes } from './routes/auth';
import { menuRoutes } from './routes/menu';
import { deskRoutes } from './routes/desk';
import { orderRoutes } from './routes/order';
import { paymentRoutes } from './routes/payment';
import { subscriptionRoutes } from './routes/subscription';
import { customerRoutes } from './routes/customer';
import { ok, fail } from './utils/response';

export { DeskRoomDO } from './do/desk-room';

const app = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

// ===== 全局 CORS + 错误处理 =====
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  await next();
});

app.onError(errorHandler);

// ===== 健康检查 =====
app.get('/api/health', (c) => c.json(ok({ status: 'ok', time: new Date().toISOString() })));

// ===== 公开路由 (无需认证) =====

// 顾客扫码点餐 (通过 qr_token 认证)
app.route('/api/customer/', customerRoutes);

// 微信支付回调 (通过签名验证)
app.post('/api/webhook/wechat-pay', (c) => paymentRoutes.fetch(c.req.raw, c.env));

// 认证: 注册 / 登录 / 刷新 (无需 JWT)
app.post('/api/auth/register', (c) => authRoutes.fetch(c.req.raw, c.env));
app.post('/api/auth/login', (c) => authRoutes.fetch(c.req.raw, c.env));
app.post('/api/auth/refresh', (c) => authRoutes.fetch(c.req.raw, c.env));

// ===== 受保护路由 (需要 JWT + 租户隔离) =====
const auth = new Hono<{ Bindings: Env; Variables: AppVars & { db: TenantDB } }>();
auth.use('*', authMiddleware);
auth.use('*', tenantMiddleware);

// 用户管理 (需要认证)
auth.get('/api/auth/users', (c) => authRoutes.fetch(c.req.raw, c.env));
auth.post('/api/auth/users', requireRole('owner', 'manager'), (c) => authRoutes.fetch(c.req.raw, c.env));
auth.delete('/api/auth/users/:id', requireRole('owner', 'manager'), (c) => authRoutes.fetch(c.req.raw, c.env));

// 菜品管理
auth.route('/api/menu', menuRoutes);

// 桌位管理
auth.route('/api/desks', deskRoutes);

// 订单管理
auth.route('/api/orders', orderRoutes);

// 订阅管理
auth.route('/api/subscription', subscriptionRoutes);

// 支付创建 (JSAPI/H5)
auth.post('/api/payment/wechat/jsapi', (c) => paymentRoutes.fetch(c.req.raw, c.env));
auth.post('/api/payment/wechat/h5', (c) => paymentRoutes.fetch(c.req.raw, c.env));

app.route('/', auth);

// ===== WebSocket 路由 (通过 query 参数验证) =====
app.get('/ws/desk/:tenantId/:deskId', async (c) => {
  const tenantId = c.req.param('tenantId');
  const deskId = c.req.param('deskId');
  const role = c.req.query('role') || 'customer';

  const doId = c.env.DESK_ROOM.idFromName(`${tenantId}:${deskId}`);
  const stub = c.env.DESK_ROOM.get(doId);

  const url = new URL(c.req.url);
  url.searchParams.set('role', role);
  url.pathname = '/ws';

  return stub.fetch(url.toString(), c.req.raw);
});

// ===== 定时任务: 检查订阅到期 =====
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const now = new Date().toISOString();

    // 过期的付费租户 -> expired
    await env.DB.prepare(
      `UPDATE tenants SET status = 'expired' WHERE status = 'active' AND paid_until < ?`
    ).bind(now).run();

    // 过期的试用租户 -> expired
    await env.DB.prepare(
      `UPDATE tenants SET status = 'expired'
       WHERE status = 'trial'
       AND datetime(trial_started_at, '+' || trial_days || ' days') < datetime('now')`
    ).run();

    // 清除租户状态缓存
    const tenants = await env.DB.prepare('SELECT id FROM tenants').all<{ id: string }>();
    for (const t of tenants.results || []) {
      await env.KV.delete(`tenant:status:${t.id}`);
    }

    console.log('Subscription check completed at', now);
  },
};
