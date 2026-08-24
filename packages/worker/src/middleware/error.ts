import type { Context } from 'hono';
import { fail } from '../utils/response';

/**
 * 全局错误处理
 */
export function errorHandler(err: Error, c: Context) {
  console.error('Unhandled error:', err);
  return c.json(fail(err.message || '服务器内部错误', 500), 500);
}

/**
 * CORS 中间件
 */
export function corsMiddleware(c: Context, next: () => Promise<void>): Promise<void> | Response {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    }) as unknown as Promise<void>;
  }
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return next();
}
