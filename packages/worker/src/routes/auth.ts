import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import { TenantDB } from '../db/client';
import { hashPassword, verifyPassword, randomHex } from '../utils/crypto';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';
import { generateId, generateShortCode } from '../utils/id';
import { ok, fail } from '../utils/response';
import type { ApiResponse, Tenant, TenantUser } from '@restaurant/shared';

export const authRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars;
}>();

/**
 * POST /api/auth/register - 注册新租户(餐厅)
 */
authRoutes.post('/register', async (c) => {
  const body = await c.req.json<{
    name: string;
    contactPhone: string;
    password: string;
    managerName?: string;
  }>();

  if (!body.name || !body.contactPhone || !body.password) {
    return c.json(fail('餐厅名称、联系电话和密码为必填项'), 400);
  }

  // 检查手机号是否已注册
  const existing = await c.env.DB.prepare(
    `SELECT t.id FROM tenants t
     JOIN tenant_users u ON u.tenant_id = t.id
     WHERE u.phone = ?`
  ).bind(body.contactPhone).first();

  if (existing) {
    return c.json(fail('该手机号已注册'), 409);
  }

  const tenantId = generateId('tnt');
  const userId = generateId('usr');
  const code = generateShortCode(6);
  const passwordHash = await hashPassword(body.password);
  const now = new Date().toISOString();

  // 创建租户和 owner 用户
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO tenants (id, name, code, contact_phone, status, trial_started_at, trial_days, plan_price_fen, plan_cycle_days, paid_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'trial', ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      tenantId, body.name, code, body.contactPhone,
      now,
      parseInt(c.env.DEFAULT_TRIAL_DAYS || '7'),
      parseInt(c.env.DEFAULT_PLAN_PRICE_FEN || '9900'),
      parseInt(c.env.DEFAULT_PLAN_CYCLE_DAYS || '30'),
      now,
      now, now
    ),
    c.env.DB.prepare(
      `INSERT INTO tenant_users (id, tenant_id, phone, password_hash, name, role, created_at)
       VALUES (?, ?, ?, ?, ?, 'owner', ?)`
    ).bind(
      userId, tenantId, body.contactPhone, passwordHash,
      body.managerName || body.name, now
    ),
  ]);

  const accessToken = await signAccessToken(c.env, { tenantId, userId, role: 'owner' });
  const refreshToken = await signRefreshToken(c.env, { tenantId, userId, role: 'owner' });

  return c.json(ok({
    accessToken,
    refreshToken,
    tenant: { id: tenantId, name: body.name, code },
    user: { id: userId, role: 'owner', phone: body.contactPhone },
  }, '注册成功'), 201);
});

/**
 * POST /api/auth/login - 店员登录
 */
authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ phone: string; password: string }>();

  if (!body.phone || !body.password) {
    return c.json(fail('手机号和密码为必填项'), 400);
  }

  const user = await c.env.DB.prepare(
    `SELECT id, tenant_id, phone, password_hash, name, role FROM tenant_users WHERE phone = ?`
  ).bind(body.phone).first<TenantUser & { password_hash: string }>();

  if (!user) {
    return c.json(fail('用户不存在'), 404);
  }

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) {
    return c.json(fail('密码错误'), 401);
  }

  const accessToken = await signAccessToken(c.env, { tenantId: user.tenantId, userId: user.id, role: user.role });
  const refreshToken = await signRefreshToken(c.env, { tenantId: user.tenantId, userId: user.id, role: user.role });

  return c.json(ok({
    accessToken,
    refreshToken,
    user: { id: user.id, tenantId: user.tenantId, phone: user.phone, name: user.name, role: user.role },
  }));
});

/**
 * POST /api/auth/refresh - 刷新 token
 */
authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();

  if (!body.refreshToken) {
    return c.json(fail('缺少 refresh token'), 400);
  }

  const payload = await verifyToken(c.env, body.refreshToken);
  if (!payload || payload.type !== 'refresh') {
    return c.json(fail('refresh token 无效'), 401);
  }

  const accessToken = await signAccessToken(c.env, {
    tenantId: payload.tenantId,
    userId: payload.userId,
    role: payload.role,
  });

  return c.json(ok({ accessToken }));
});

/**
 * POST /api/auth/users - 添加店员 (owner/manager 权限)
 */
authRoutes.post('/users', async (c) => {
  const role = c.get('role');
  if (role !== 'owner' && role !== 'manager') {
    return c.json(fail('无权限'), 403);
  }

  const tenantId = c.get('tenantId');
  const body = await c.req.json<{ phone: string; password: string; name: string; role: string }>();

  if (!body.phone || !body.password || !body.role) {
    return c.json(fail('手机号、密码、角色为必填项'), 400);
  }

  const validRoles = ['manager', 'bar', 'kitchen'];
  if (!validRoles.includes(body.role)) {
    return c.json(fail('无效的角色'), 400);
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM tenant_users WHERE tenant_id = ? AND phone = ?`
  ).bind(tenantId, body.phone).first();

  if (existing) {
    return c.json(fail('该手机号已存在'), 409);
  }

  const userId = generateId('usr');
  const passwordHash = await hashPassword(body.password);

  await c.env.DB.prepare(
    `INSERT INTO tenant_users (id, tenant_id, phone, password_hash, name, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(userId, tenantId, body.phone, passwordHash, body.name || '', body.role, new Date().toISOString()).run();

  return c.json(ok({ id: userId, phone: body.phone, name: body.name, role: body.role }, '添加成功'), 201);
});

/**
 * GET /api/auth/users - 获取店员列表
 */
authRoutes.get('/users', async (c) => {
  const tenantId = c.get('tenantId');
  const results = await c.env.DB.prepare(
    `SELECT id, phone, name, role, created_at FROM tenant_users WHERE tenant_id = ? ORDER BY created_at DESC`
  ).bind(tenantId).all();

  return c.json(ok(results.results || []));
});

/**
 * DELETE /api/auth/users/:id - 删除店员
 */
authRoutes.delete('/users/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.req.param('id');
  const currentRole = c.get('role');

  if (currentRole !== 'owner' && currentRole !== 'manager') {
    return c.json(fail('无权限'), 403);
  }

  const result = await c.env.DB.prepare(
    `DELETE FROM tenant_users WHERE tenant_id = ? AND id = ? AND role != 'owner'`
  ).bind(tenantId, userId).run();

  if (result.meta.changes === 0) {
    return c.json(fail('删除失败，用户不存在或为owner'), 400);
  }

  return c.json(ok(null, '删除成功'));
});
