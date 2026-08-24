import { Hono } from 'hono';
import type { Env, AppVars } from '../types';
import type { TenantDB } from '../db/client';
import { generateId } from '../utils/id';
import { ok, fail } from '../utils/response';

export const menuRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVars & { db: TenantDB };
}>();

// ===== 分类管理 =====

/**
 * GET /api/menu/categories - 获取分类列表
 */
menuRoutes.get('/categories', async (c) => {
  const db = c.get('db');
  const results = await db.query(
    'SELECT id, name, sort_order FROM categories ORDER BY sort_order ASC, created_at ASC'
  );
  return c.json(ok(results));
});

/**
 * POST /api/menu/categories - 新增分类
 */
menuRoutes.post('/categories', async (c) => {
  const db = c.get('db');
  const body = await c.req.json<{ name: string; sortOrder?: number }>();

  if (!body.name) return c.json(fail('分类名称为必填项'), 400);

  const id = generateId('cat');
  await db.insert('categories', {
    id, name: body.name,
    sort_order: body.sortOrder ?? 0,
    created_at: new Date().toISOString(),
  });

  return c.json(ok({ id, name: body.name, sortOrder: body.sortOrder ?? 0 }), 201);
});

/**
 * PUT /api/menu/categories/:id - 修改分类
 */
menuRoutes.put('/categories/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  const body = await c.req.json<{ name?: string; sortOrder?: number }>();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

  if (Object.keys(updates).length === 0) return c.json(fail('无更新内容'), 400);

  await db.update('categories', id, updates);
  return c.json(ok(null, '修改成功'));
});

/**
 * DELETE /api/menu/categories/:id - 删除分类
 */
menuRoutes.delete('/categories/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  // 检查是否有关联菜品
  const dishes = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM dishes WHERE category_id = ?',
    [id]
  );
  if (dishes && dishes.count > 0) {
    return c.json(fail('该分类下有菜品，无法删除'), 400);
  }

  await db.delete('categories', id);
  return c.json(ok(null, '删除成功'));
});

// ===== 菜品管理 =====

/**
 * GET /api/menu/dishes - 获取菜品列表
 */
menuRoutes.get('/dishes', async (c) => {
  const db = c.get('db');
  const categoryId = c.req.query('categoryId');
  const onlyAvailable = c.req.query('available') === '1';

  let sql = `SELECT id, category_id, name, description, price_fen, image_url, available, stock, sort_order, created_at FROM dishes WHERE 1=1`;
  const params: unknown[] = [];
  if (categoryId) { sql += ` AND category_id = ?`; params.push(categoryId); }
  if (onlyAvailable) { sql += ` AND available = 1`; }
  sql += ` ORDER BY sort_order ASC, created_at ASC`;

  const results = await db.query(sql, params);
  return c.json(ok(results));
});

/**
 * POST /api/menu/dishes - 新增菜品
 */
menuRoutes.post('/dishes', async (c) => {
  const db = c.get('db');
  const body = await c.req.json<{
    categoryId?: string;
    name: string;
    description?: string;
    priceFen: number;
    stock?: number;
    sortOrder?: number;
  }>();

  if (!body.name || body.priceFen === undefined) {
    return c.json(fail('菜品名称和价格为必填项'), 400);
  }

  const id = generateId('dsh');
  await db.insert('dishes', {
    id,
    category_id: body.categoryId || null,
    name: body.name,
    description: body.description || null,
    price_fen: body.priceFen,
    image_key: null,
    image_url: null,
    available: 1,
    stock: body.stock ?? -1,
    sort_order: body.sortOrder ?? 0,
    created_at: new Date().toISOString(),
  });

  return c.json(ok({ id }, '新增成功'), 201);
});

/**
 * PUT /api/menu/dishes/:id - 修改菜品
 */
menuRoutes.put('/dishes/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  const body = await c.req.json<{
    categoryId?: string;
    name?: string;
    description?: string;
    priceFen?: number;
    stock?: number;
    available?: boolean;
    sortOrder?: number;
  }>();

  const updates: Record<string, unknown> = {};
  if (body.categoryId !== undefined) updates.category_id = body.categoryId;
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.priceFen !== undefined) updates.price_fen = body.priceFen;
  if (body.stock !== undefined) updates.stock = body.stock;
  if (body.available !== undefined) updates.available = body.available ? 1 : 0;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

  if (Object.keys(updates).length === 0) return c.json(fail('无更新内容'), 400);

  await db.update('dishes', id, updates);
  return c.json(ok(null, '修改成功'));
});

/**
 * DELETE /api/menu/dishes/:id - 删除菜品
 */
menuRoutes.delete('/dishes/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  await db.delete('dishes', id);
  return c.json(ok(null, '删除成功'));
});

/**
 * POST /api/menu/dishes/:id/image - 上传菜品图片到 R2
 */
menuRoutes.post('/dishes/:id/image', async (c) => {
  const db = c.get('db');
  const tenantId = c.get('tenantId');
  const dishId = c.req.param('id');

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return c.json(fail('请上传图片文件'), 400);
  }

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json(fail('仅支持 JPG/PNG/WebP/GIF 格式'), 400);
  }

  // 限制大小 2MB
  if (file.size > 2 * 1024 * 1024) {
    return c.json(fail('图片大小不能超过 2MB'), 400);
  }

  const ext = file.type.split('/')[1];
  const imageKey = `tenants/${tenantId}/dishes/${dishId}.${ext}`;

  // 上传到 R2
  await c.env.R2.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const imageUrl = `${c.env.PUBLIC_R2_DOMAIN}/${imageKey}`;

  // 更新菜品记录
  await db.update('dishes', dishId, {
    image_key: imageKey,
    image_url: imageUrl,
  });

  return c.json(ok({ imageUrl }, '上传成功'));
});
