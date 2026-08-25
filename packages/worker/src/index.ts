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

// ===== 数据库初始化端点 (临时) =====
app.get('/api/init-db', async (c) => {
  const sqls = [
    `CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, contact_phone TEXT, wechat_appid TEXT, wechat_mchid TEXT, wechat_api_v3_key TEXT, status TEXT NOT NULL DEFAULT 'trial', trial_started_at TEXT, trial_days INTEGER NOT NULL DEFAULT 7, plan_price_fen INTEGER NOT NULL DEFAULT 9900, plan_cycle_days INTEGER NOT NULL DEFAULT 30, paid_until TEXT, settings TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS tenant_users (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, phone TEXT NOT NULL, password_hash TEXT NOT NULL, name TEXT, role TEXT NOT NULL DEFAULT 'manager', created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(tenant_id, phone))`,
    `CREATE INDEX IF NOT EXISTS idx_tu_tenant ON tenant_users(tenant_id)`,
    `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_cat_tenant ON categories(tenant_id)`,
    `CREATE TABLE IF NOT EXISTS dishes (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, category_id TEXT, name TEXT NOT NULL, description TEXT, price_fen INTEGER NOT NULL, image_key TEXT, image_url TEXT, available INTEGER NOT NULL DEFAULT 1, stock INTEGER NOT NULL DEFAULT -1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (category_id) REFERENCES categories(id))`,
    `CREATE INDEX IF NOT EXISTS idx_dish_tenant ON dishes(tenant_id, category_id)`,
    `CREATE TABLE IF NOT EXISTS desks (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, number TEXT NOT NULL, name TEXT, capacity INTEGER NOT NULL DEFAULT 4, qr_token TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'idle', created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(tenant_id, number))`,
    `CREATE INDEX IF NOT EXISTS idx_desk_tenant ON desks(tenant_id)`,
    `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, desk_id TEXT NOT NULL, desk_number TEXT NOT NULL, order_no TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', settle_type TEXT, total_fen INTEGER NOT NULL DEFAULT 0, pay_method TEXT, paid_fen INTEGER NOT NULL DEFAULT 0, wechat_trade_no TEXT, openid TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), paid_at TEXT, closed_at TEXT, FOREIGN KEY (desk_id) REFERENCES desks(id))`,
    `CREATE INDEX IF NOT EXISTS idx_order_tenant_status ON orders(tenant_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_order_desk ON orders(tenant_id, desk_id, status)`,
    `CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, order_id TEXT NOT NULL, dish_id TEXT NOT NULL, dish_name TEXT NOT NULL, price_fen INTEGER NOT NULL, quantity INTEGER NOT NULL, remark TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (order_id) REFERENCES orders(id))`,
    `CREATE INDEX IF NOT EXISTS idx_oi_order ON order_items(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_oi_tenant ON order_items(tenant_id)`,
    `CREATE TABLE IF NOT EXISTS subscription_payments (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, out_trade_no TEXT UNIQUE NOT NULL, amount_fen INTEGER NOT NULL, cycle_days INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'unpaid', wechat_trade_no TEXT, paid_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_sp_tenant ON subscription_payments(tenant_id)`,
    `CREATE TABLE IF NOT EXISTS print_logs (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, order_id TEXT NOT NULL, printer_type TEXT, printed_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id)`,
  ];
  const results: string[] = [];
  for (const sql of sqls) {
    try {
      await c.env.DB.exec(sql);
      results.push('OK');
    } catch (e: any) {
      results.push(`ERROR: ${e.message}`);
    }
  }
  return c.json(ok({ tables: sqls.length, results }));
});

// ===== 公开路由 (无需认证) =====

// 顾客扫码点餐 (通过 qr_token 认证) - customerRoutes 内部路由用 /:qrToken/... 前缀
app.route('/api/customer', customerRoutes);

// 微信支付回调 - paymentRoutes 内部路由用 /wechat-pay/webhook 前缀
app.route('/api/webhook', new Hono<{ Bindings: Env }>()
  .post('/wechat-pay', (c) => paymentRoutes.fetch(new Request(new URL('/wechat-pay/webhook', c.req.url), c.req.raw), c.env))
);

// 公开认证路由: 注册/登录/刷新 (无需 JWT)
// 直接挂载 authRoutes 在 /api/auth 下，这样 /register -> /api/auth/register
app.route('/api/auth', authRoutes);

// ===== 受保护路由 (需要 JWT + 租户隔离) =====
// 使用 app.use 在主应用上注册中间件，确保 Context 变量正确传递
app.use('/api/menu/*', authMiddleware);
app.use('/api/menu/*', tenantMiddleware);
app.use('/api/desks/*', authMiddleware);
app.use('/api/desks/*', tenantMiddleware);
app.use('/api/orders/*', authMiddleware);
app.use('/api/orders/*', tenantMiddleware);
app.use('/api/subscription/*', authMiddleware);
app.use('/api/subscription/*', tenantMiddleware);
app.use('/api/users/*', authMiddleware);
app.use('/api/users/*', tenantMiddleware);
app.use('/api/payment/wechat/*', authMiddleware);
app.use('/api/payment/wechat/*', tenantMiddleware);

// 用户管理 (受保护，需要认证) - 代理到 authRoutes
app.get('/api/users', (c) => authRoutes.fetch(new Request(new URL('/api/auth/users', c.req.url), c.req.raw), c.env));
app.post('/api/users', (c) => authRoutes.fetch(new Request(new URL('/api/auth/users', c.req.url), { ...c.req.raw, method: 'POST' }), c.env));
app.delete('/api/users/:id', (c) => authRoutes.fetch(new Request(new URL(`/api/auth/users/${c.req.param('id')}`, c.req.url), { ...c.req.raw, method: 'DELETE' }), c.env));

// 菜品管理
app.route('/api/menu', menuRoutes);

// 桌位管理
app.route('/api/desks', deskRoutes);

// 订单管理
app.route('/api/orders', orderRoutes);

// 订阅管理
app.route('/api/subscription', subscriptionRoutes);

// 支付创建 (JSAPI/H5 需要认证)
app.post('/api/payment/wechat/jsapi', (c) => paymentRoutes.fetch(c.req.raw, c.env));
app.post('/api/payment/wechat/h5', (c) => paymentRoutes.fetch(c.req.raw, c.env));

// ===== WebSocket 路由 =====
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

    await env.DB.prepare(
      `UPDATE tenants SET status = 'expired' WHERE status = 'active' AND paid_until < ?`
    ).bind(now).run();

    await env.DB.prepare(
      `UPDATE tenants SET status = 'expired'
       WHERE status = 'trial'
       AND datetime(trial_started_at, '+' || trial_days || ' days') < datetime('now')`
    ).run();

    const tenants = await env.DB.prepare('SELECT id FROM tenants').all<{ id: string }>();
    for (const t of tenants.results || []) {
      await env.KV.delete(`tenant:status:${t.id}`);
    }

    console.log('Subscription check completed at', now);
  },
};
