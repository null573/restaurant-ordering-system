import { createMiddleware } from 'hono/factory';
import type { Env, AppVars } from '../types';
import { verifyToken, extractToken } from '../utils/jwt';
import { fail } from '../utils/response';
import type { JWTPayload } from '@restaurant/shared';

/**
 * JWT 认证中间件 - 验证 token 并注入用户信息
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVars;
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return c.json(fail('未登录，请先登录', 401), 401);
  }

  const payload = await verifyToken(c.env, token);
  if (!payload) {
    return c.json(fail('登录已过期，请重新登录', 401), 401);
  }

  if (payload.type !== 'access') {
    return c.json(fail('无效的令牌类型', 401), 401);
  }

  c.set('tenantId', payload.tenantId);
  c.set('userId', payload.userId);
  c.set('role', payload.role);
  c.set('jwtPayload', payload as unknown as JWTPayload);

  await next();
});

/**
 * 角色权限检查中间件工厂
 */
export function requireRole(...roles: string[]) {
  return createMiddleware<{
    Bindings: Env;
    Variables: AppVars;
  }>(async (c, next) => {
    const role = c.get('role');
    if (!roles.includes(role)) {
      return c.json(fail('无权限执行此操作', 403), 403);
    }
    await next();
  });
}
