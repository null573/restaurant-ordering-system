import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import { TenantDB } from '../db/client';
import { generateId, generateOrderNo } from '../utils/id';
import { ok, fail } from '../utils/response';
import type { CartItem } from '@restaurant/shared';

export const customerRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

/**
 * GET /api/customer/:qrToken/menu - 顾客扫码获取菜单
 * 不需要 JWT 认证，通过 qr_token 关联租户
 */
customerRoutes.get('/:qrToken/menu', async (c) => {
  const qrToken = c.req.param('qrToken');

  // 通过 qr_token 查找桌位和租户
  const desk = await c.env.DB.prepare(
    `SELECT d.id, d.tenant_id, d.number, d.name, d.status, t.name as tenant_name
     FROM desks d JOIN tenants t ON t.id = d.tenant_id
     WHERE d.qr_token = ?`
  ).bind(qrToken).first<{
    id: string; tenant_id: string; number: string; name: string | null;
    status: string; tenant_name: string;
  }>();

  if (!desk) return c.json(fail('二维码无效'), 404);

  // 检查租户状态
  if (desk.tenant_id) {
    const tenant = await c.env.DB.prepare(
      'SELECT status FROM tenants WHERE id = ?'
    ).bind(desk.tenant_id).first<{ status: string }>();

    if (tenant && (tenant.status === 'expired' || tenant.status === 'suspended')) {
      return c.json(fail('该餐厅系统暂不可用'), 503);
    }
  }

  // 获取分类和菜品
  const categories = await c.env.DB.prepare(
    `SELECT id, name, sort_order FROM categories WHERE tenant_id = ? ORDER BY sort_order ASC`
  ).bind(desk.tenant_id).all();

  const dishes = await c.env.DB.prepare(
    `SELECT id, category_id, name, description, price_fen, image_url, available, stock
     FROM dishes WHERE tenant_id = ? ORDER BY sort_order ASC`
  ).bind(desk.tenant_id).all();

  return c.json(ok({
    tenantName: desk.tenant_name,
    deskId: desk.id,
    deskNumber: desk.number,
    deskName: desk.name,
    categories: categories.results || [],
    dishes: (dishes.results || []).filter((d: any) => d.available),
  }));
});

/**
 * POST /api/customer/:qrToken/order - 顾客提交订单
 * 不需要 JWT，通过 qr_token 关联
 */
customerRoutes.post('/:qrToken/order', async (c) => {
  const qrToken = c.req.param('qrToken');
  const body = await c.req.json<{ items: CartItem[]; remark?: string }>();

  if (!body.items || body.items.length === 0) {
    return c.json(fail('请至少选择一道菜品'), 400);
  }

  // 查找桌位
  const desk = await c.env.DB.prepare(
    `SELECT id, tenant_id, number, status FROM desks WHERE qr_token = ?`
  ).bind(qrToken).first<{ id: string; tenant_id: string; number: string; status: string }>();

  if (!desk) return c.json(fail('二维码无效'), 404);

  // 检查桌位状态
  if (desk.status === 'paying') {
    return c.json(fail('该桌位正在结账中，请稍候'), 409);
  }

  const tenantId = desk.tenant_id;
  const db = new TenantDB(c.env.DB, tenantId);

  // 验证菜品并计算总价
  const dishIds = body.items.map(i => i.dishId);
  const placeholders = dishIds.map(() => '?').join(',');
  const dishRows = await c.env.DB.prepare(
    `SELECT id, name, price_fen, available, stock FROM dishes WHERE tenant_id = ? AND id IN (${placeholders})`
  ).bind(tenantId, ...dishIds).all();

  type DishRow = { id: string; name: string; price_fen: number; available: number; stock: number };
  const dishList = (dishRows.results || []) as DishRow[];
  const dishMap = new Map(dishList.map(d => [d.id, d]));

  let totalFen = 0;
  const orderItems: { dishId: string; dishName: string; priceFen: number; quantity: number; remark: string }[] = [];

  for (const item of body.items) {
    const dish = dishMap.get(item.dishId);
    if (!dish) return c.json(fail(`菜品不存在: ${item.dishId}`), 400);
    if (!dish.available) return c.json(fail(`菜品已下架: ${dish.name}`), 400);
    if (dish.stock >= 0 && dish.stock < item.quantity) {
      return c.json(fail(`库存不足: ${dish.name}`), 400);
    }
    totalFen += dish.price_fen * item.quantity;
    orderItems.push({
      dishId: dish.id,
      dishName: dish.name,
      priceFen: dish.price_fen,
      quantity: item.quantity,
      remark: item.remark || '',
    });
  }

  // 生成订单号
  const orderId = generateId('ord');
  const seq = Math.floor(Math.random() * 1000);
  const orderNo = generateOrderNo(desk.number, seq);
  const now = new Date().toISOString();

  // 创建订单和明细
  const stmts = [
    c.env.DB.prepare(
      `INSERT INTO orders (id, tenant_id, desk_id, desk_number, order_no, status, total_fen, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(orderId, tenantId, desk.id, desk.number, orderNo, totalFen, now),

    ...orderItems.map(item =>
      c.env.DB.prepare(
        `INSERT INTO order_items (id, tenant_id, order_id, dish_id, dish_name, price_fen, quantity, remark, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
      ).bind(generateId('oit'), tenantId, orderId, item.dishId, item.dishName, item.priceFen, item.quantity, item.remark, now)
    ),
  ];

  await c.env.DB.batch(stmts);

  // 更新桌位状态为占用
  await c.env.DB.prepare(
    `UPDATE desks SET status = 'occupied' WHERE tenant_id = ? AND id = ?`
  ).bind(tenantId, desk.id).run();

  // 通过 DO 广播新订单
  const doId = c.env.DESK_ROOM.idFromName(`${tenantId}:${desk.id}`);
  const stub = c.env.DESK_ROOM.get(doId);
  await stub.fetch(`https://do-broadcast/broadcast`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'order:new',
      orderId,
      deskId: desk.id,
      deskNumber: desk.number,
      items: orderItems.map(i => ({ dishName: i.dishName, quantity: i.quantity, remark: i.remark })),
    }),
  }).catch(() => {});

  // 同时广播桌位状态变更
  await stub.fetch(`https://do-broadcast/broadcast`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'desk:status',
      deskId: desk.id,
      status: 'occupied',
    }),
  }).catch(() => {});

  return c.json(ok({
    orderId,
    orderNo,
    totalFen,
    items: orderItems,
  }, '下单成功'), 201);
});

/**
 * GET /api/customer/:qrToken/order - 查询该桌当前订单
 * 返回 camelCase 字段（含 tenantId / deskId，供顾客端建立 WebSocket 连接）
 */
customerRoutes.get('/:qrToken/order', async (c) => {
  const qrToken = c.req.param('qrToken');

  const desk = await c.env.DB.prepare(
    `SELECT id, tenant_id, number FROM desks WHERE qr_token = ?`
  ).bind(qrToken).first<{ id: string; tenant_id: string; number: string }>();

  if (!desk) return c.json(fail('二维码无效'), 404);

  // 获取该桌未关闭的订单
  const order = await c.env.DB.prepare(
    `SELECT id, tenant_id, desk_id, order_no, status, total_fen, settle_type, pay_method, created_at
     FROM orders WHERE tenant_id = ? AND desk_id = ? AND status IN ('pending','paid','cooking','served')
     ORDER BY created_at DESC LIMIT 1`
  ).bind(desk.tenant_id, desk.id).first<{
    id: string; tenant_id: string; desk_id: string; order_no: string; status: string;
    total_fen: number; settle_type: string | null; pay_method: string | null; created_at: string;
  }>();

  if (!order) {
    return c.json(ok(null));
  }

  const items = await c.env.DB.prepare(
    `SELECT id, dish_id, dish_name, price_fen, quantity, remark, status
     FROM order_items WHERE tenant_id = ? AND order_id = ?`
  ).bind(desk.tenant_id, order.id).all<{
    id: string; dish_id: string; dish_name: string; price_fen: number;
    quantity: number; remark: string | null; status: string;
  }>();

  return c.json(ok({
    id: order.id,
    tenantId: order.tenant_id,
    deskId: order.desk_id,
    orderNo: order.order_no,
    status: order.status,
    totalFen: order.total_fen,
    settleType: order.settle_type,
    payMethod: order.pay_method,
    createdAt: order.created_at,
    items: (items.results || []).map((i) => ({
      id: i.id,
      dishId: i.dish_id,
      dishName: i.dish_name,
      priceFen: i.price_fen,
      quantity: i.quantity,
      remark: i.remark,
      status: i.status,
    })),
  }));
});
