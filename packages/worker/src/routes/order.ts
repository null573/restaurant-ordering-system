import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import type { TenantDB } from '../db/client';
import { generateId, generateOrderNo } from '../utils/id';
import { ok, fail } from '../utils/response';
import type { CartItem } from '@restaurant/shared';

export const orderRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

/**
 * GET /api/orders - 订单列表 (吧台/厨房)
 * query: status=pending|cooking|served|closed
 */
orderRoutes.get('/', async (c) => {
  const db = c.get('db');
  const status = c.req.query('status');
  const deskId = c.req.query('deskId');

  let sql = `SELECT id, desk_id, desk_number, order_no, status, settle_type, total_fen, pay_method, paid_fen, created_at, paid_at, closed_at FROM orders WHERE 1=1`;
  const params: unknown[] = [];
  if (status) { sql += ` AND status = ?`; params.push(status); }
  if (deskId) { sql += ` AND desk_id = ?`; params.push(deskId); }
  sql += ` ORDER BY created_at DESC LIMIT 200`;

  const results = await db.query(sql, params);
  return c.json(ok(results));
});

/**
 * GET /api/orders/:id - 订单详情 (含明细)
 */
orderRoutes.get('/:id', async (c) => {
  const db = c.get('db');
  const orderId = c.req.param('id');

  const order = await db.queryOne(
    `SELECT id, desk_id, desk_number, order_no, status, settle_type, total_fen, pay_method, paid_fen, wechat_trade_no, created_at, paid_at, closed_at FROM orders WHERE id = ?`,
    [orderId]
  );

  if (!order) return c.json(fail('订单不存在'), 404);

  const items = await db.query(
    `SELECT id, dish_id, dish_name, price_fen, quantity, remark, status, created_at FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
    [orderId]
  );

  return c.json(ok({ ...order, items }));
});

/**
 * PATCH /api/orders/:id/status - 更新订单状态
 */
orderRoutes.patch('/:id/status', async (c) => {
  const db = c.get('db');
  const orderId = c.req.param('id');
  const body = await c.req.json<{ status: string }>();

  const validStatus = ['pending', 'paid', 'cooking', 'served', 'closed', 'cancelled'];
  if (!validStatus.includes(body.status)) {
    return c.json(fail('无效的订单状态'), 400);
  }

  const updates: Record<string, unknown> = { status: body.status };
  if (body.status === 'closed') updates.closed_at = new Date().toISOString();
  if (body.status === 'paid') updates.paid_at = new Date().toISOString();

  await db.update('orders', orderId, updates);

  // 如果订单关闭，更新桌位状态为空闲
  if (body.status === 'closed' || body.status === 'cancelled') {
    const order = await db.queryOne<{ desk_id: string }>(
      'SELECT desk_id FROM orders WHERE id = ?', [orderId]
    );
    if (order) {
      await db.exec(
        `UPDATE desks SET status = 'idle' WHERE id = ?`,
        [order.desk_id]
      );
    }
  }

  // 通过 DO 广播状态变更
  const orderInfo = await db.queryOne<{ desk_id: string }>(
    'SELECT desk_id FROM orders WHERE id = ?', [orderId]
  );
  if (orderInfo) {
    await broadcastToDesk(c, orderInfo.desk_id, {
      type: 'order:status',
      orderId,
      status: body.status,
    });
  }

  return c.json(ok(null, '状态已更新'));
});

/**
 * PATCH /api/orders/:id/items/:itemId/status - 更新菜品制作状态
 */
orderRoutes.patch('/:id/items/:itemId/status', async (c) => {
  const db = c.get('db');
  const orderId = c.req.param('id');
  const itemId = c.req.param('itemId');
  const body = await c.req.json<{ status: string }>();

  const validStatus = ['new', 'cooking', 'done'];
  if (!validStatus.includes(body.status)) {
    return c.json(fail('无效的状态'), 400);
  }

  await db.exec(
    `UPDATE order_items SET status = ? WHERE tenant_id = ? AND id = ? AND order_id = ?`,
    [body.status, db.tid, itemId, orderId]
  );

  return c.json(ok(null, '状态已更新'));
});

/**
 * POST /api/orders/bar/cash - 吧台现金结账 (含找零计算)
 */
orderRoutes.post('/bar/cash', async (c) => {
  const db = c.get('db');
  const body = await c.req.json<{ orderId: string; paidFen: number }>();

  if (!body.orderId || body.paidFen === undefined) {
    return c.json(fail('订单ID和实付金额为必填项'), 400);
  }

  const order = await db.queryOne<{ id: string; total_fen: number; desk_id: string; desk_number: string; order_no: string }>(
    `SELECT id, total_fen, desk_id, desk_number, order_no FROM orders WHERE id = ?`,
    [body.orderId]
  );

  if (!order) return c.json(fail('订单不存在'), 404);
  if (body.paidFen < order.total_fen) {
    return c.json(fail('实付金额不足'), 400);
  }

  const changeFen = body.paidFen - order.total_fen;
  const now = new Date().toISOString();

  await db.update('orders', body.orderId, {
    status: 'closed',
    settle_type: 'bar',
    pay_method: 'cash',
    paid_fen: body.paidFen,
    closed_at: now,
    paid_at: now,
  });

  // 桌位恢复空闲
  await db.exec(
    `UPDATE desks SET status = 'idle' WHERE tenant_id = ? AND id = ?`,
    [db.tid, order.desk_id]
  );

  // 广播结账完成
  await broadcastToDesk(c, order.desk_id, {
    type: 'payment:done',
    orderId: body.orderId,
    payMethod: 'cash',
  });

  // 返回结算单信息 (打印用)
  return c.json(ok({
    orderId: order.id,
    orderNo: order.order_no,
    deskNumber: order.desk_number,
    totalFen: order.total_fen,
    paidFen: body.paidFen,
    changeFen,
    payMethod: 'cash',
    paidAt: now,
  }, '现金结账成功'));
});

/**
 * GET /api/orders/:id/receipt - 获取结算单数据 (打印用)
 */
orderRoutes.get('/:id/receipt', async (c) => {
  const db = c.get('db');
  const orderId = c.req.param('id');

  const order = await db.queryOne<{
    id: string; order_no: string; desk_number: string;
    total_fen: number; pay_method: string | null; paid_fen: number;
    created_at: string; paid_at: string | null;
  }>(`SELECT id, order_no, desk_number, total_fen, pay_method, paid_fen, created_at, paid_at FROM orders WHERE id = ?`, [orderId]);

  if (!order) return c.json(fail('订单不存在'), 404);

  const items = await db.query<{ dish_name: string; price_fen: number; quantity: number }>(
    `SELECT dish_name, price_fen, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  const changeFen = order.paid_fen - order.total_fen;

  return c.json(ok({
    orderNo: order.order_no,
    deskNumber: order.desk_number,
    items: items.map(i => ({
      name: i.dish_name,
      quantity: i.quantity,
      priceFen: i.price_fen,
      subtotalFen: i.price_fen * i.quantity,
    })),
    totalFen: order.total_fen,
    payMethod: order.pay_method,
    paidFen: order.paid_fen,
    changeFen: changeFen > 0 ? changeFen : 0,
    createdAt: order.created_at,
    paidAt: order.paid_at,
  }));
});

// ===== 辅助函数 =====

/**
 * 通过 Durable Object 广播消息到指定桌位
 */
async function broadcastToDesk(c: any, deskId: string, msg: object) {
  const tenantId: string = c.get('tenantId');
  const env: Env = c.env;
  const doId = env.DESK_ROOM.idFromName(`${tenantId}:${deskId}`);
  const stub = env.DESK_ROOM.get(doId);
  // 通过 HTTP POST 到 DO 触发广播
  await stub.fetch(`https://do-broadcast/broadcast`, {
    method: 'POST',
    body: JSON.stringify(msg),
  }).catch(() => {}); // 广播失败不影响主流程
}
