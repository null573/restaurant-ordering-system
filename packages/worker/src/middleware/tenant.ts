import { createMiddleware } from 'hono/factory';
import type { Env, AppVars } from '../types';
import { TenantDB } from '../db/client';
import { fail } from '../utils/response';

/**
 * 租户隔离中间件 - 检查订阅状态并注入 TenantDB
 */
export const tenantMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>(async (c, next) => {
  const tenantId = c.get('tenantId');

  // 检查租户状态 (从 KV 缓存，未命中则查 D1)
  const cacheKey = `tenant:status:${tenantId}`;
  let tenantStatus = await c.env.KV.get(cacheKey);

  if (!tenantStatus) {
    const tenant = await c.env.DB.prepare(
      'SELECT status FROM tenants WHERE id = ?'
    ).bind(tenantId).first<{ status: string }>();

    if (!tenant) {
      return c.json(fail('租户不存在', 404), 404);
    }

    tenantStatus = tenant.status;
    // 缓存 5 分钟
    await c.env.KV.put(cacheKey, tenantStatus, { expirationTtl: 300 });
  }

  // 过期或暂停的租户只允许访问订阅相关接口
  if (tenantStatus === 'expired' || tenantStatus === 'suspended') {
    const path = c.req.path;
    if (!path.includes('/subscription')) {
      return c.json(fail('系统已过期，请续费后使用', 403), 403);
    }
  }

  // 注入带租户隔离的 DB 客户端
  const db = new TenantDB(c.env.DB, tenantId);
  c.set('db', db);

  await next();
});
