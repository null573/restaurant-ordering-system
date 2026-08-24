import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import type { TenantDB } from '../db/client';
import { generateId, generateShortCode } from '../utils/id';
import { ok, fail } from '../utils/response';

export const deskRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

/**
 * GET /api/desks - 桌位列表 (含状态)
 */
deskRoutes.get('/', async (c) => {
  const db = c.get('db');
  const results = await db.query(
    `SELECT id, number, name, capacity, qr_token, status, created_at FROM desks ORDER BY number ASC`
  );
  return c.json(ok(results));
});

/**
 * POST /api/desks - 新增桌位 (自动生成 qr_token)
 */
deskRoutes.post('/', async (c) => {
  const db = c.get('db');
  const body = await c.req.json<{
    number: string;
    name?: string;
    capacity?: number;
  }>();

  if (!body.number) return c.json(fail('桌号为必填项'), 400);

  const id = generateId('dsk');
  const qrToken = generateShortCode(16); // 16位随机 token，防遍历

  await db.insert('desks', {
    id,
    number: body.number,
    name: body.name || null,
    capacity: body.capacity ?? 4,
    qr_token: qrToken,
    status: 'idle',
    created_at: new Date().toISOString(),
  });

  return c.json(ok({ id, number: body.number, qrToken }, '新增成功'), 201);
});

/**
 * PUT /api/desks/:id - 修改桌位
 */
deskRoutes.put('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  const body = await c.req.json<{ number?: string; name?: string; capacity?: number }>();

  const updates: Record<string, unknown> = {};
  if (body.number !== undefined) updates.number = body.number;
  if (body.name !== undefined) updates.name = body.name;
  if (body.capacity !== undefined) updates.capacity = body.capacity;

  if (Object.keys(updates).length === 0) return c.json(fail('无更新内容'), 400);

  await db.update('desks', id, updates);
  return c.json(ok(null, '修改成功'));
});

/**
 * DELETE /api/desks/:id - 删除桌位
 */
deskRoutes.delete('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  await db.delete('desks', id);
  return c.json(ok(null, '删除成功'));
});

/**
 * POST /api/desks/batch - 批量新增桌位
 * body: { prefix: "A", start: 1, count: 10, capacity: 4 }
 */
deskRoutes.post('/batch', async (c) => {
  const db = c.get('db');
  const body = await c.req.json<{
    prefix: string;
    start: number;
    count: number;
    capacity?: number;
  }>();

  if (!body.prefix || !body.count) return c.json(fail('前缀和数量为必填项'), 400);

  const created: { id: string; number: string; qrToken: string }[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < body.count; i++) {
    const num = `${body.prefix}${body.start + i}`;
    const id = generateId('dsk');
    const qrToken = generateShortCode(16);

    await db.insert('desks', {
      id,
      number: num,
      name: null,
      capacity: body.capacity ?? 4,
      qr_token: qrToken,
      status: 'idle',
      created_at: now,
    });
    created.push({ id, number: num, qrToken });
  }

  return c.json(ok(created, `成功创建 ${created.length} 个桌位`), 201);
});

/**
 * GET /api/desks/:id/qrcode - 获取桌位二维码信息 (前端生成二维码)
 * 返回二维码内容 URL
 */
deskRoutes.get('/:id/qrcode', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const desk = await db.queryOne<{ id: string; number: string; name: string | null; qr_token: string }>(
    `SELECT id, number, name, qr_token FROM desks WHERE id = ?`,
    [id]
  );

  if (!desk) return c.json(fail('桌位不存在'), 404);

  // 生成扫码点餐 URL
  const qrUrl = `${c.env.APP_BASE_URL}/#/c/${desk.qr_token}`;

  return c.json(ok({
    deskId: desk.id,
    deskNumber: desk.number,
    deskName: desk.name,
    qrToken: desk.qr_token,
    qrUrl,
  }));
});

/**
 * GET /api/desks/qrcodes/all - 获取所有桌位二维码信息 (批量下载用)
 */
deskRoutes.get('/qrcodes/all', async (c) => {
  const db = c.get('db');
  const results = await db.query(
    `SELECT id, number, name, qr_token FROM desks ORDER BY number ASC`
  );

  const data = (results as { id: string; number: string; name: string | null; qr_token: string }[]).map(d => ({
    deskId: d.id,
    deskNumber: d.number,
    deskName: d.name,
    qrToken: d.qr_token,
    qrUrl: `${c.env.APP_BASE_URL}/#/c/${d.qr_token}`,
  }));

  return c.json(ok(data));
});

/**
 * GET /api/desks/status - 桌位状态概览 (管理员看板)
 */
deskRoutes.get('/status', async (c) => {
  const db = c.get('db');
  const results = await db.query(
    `SELECT d.id, d.number, d.name, d.capacity, d.status,
            (SELECT COUNT(*) FROM orders o WHERE o.desk_id = d.id AND o.status IN ('pending','paid','cooking','served')) as active_orders,
            (SELECT COALESCE(SUM(o.total_fen), 0) FROM orders o WHERE o.desk_id = d.id AND o.status IN ('pending','paid','cooking','served')) as total_fen
     FROM desks d ORDER BY d.number ASC`
  );
  return c.json(ok(results));
});
