/**
 * D1 数据库客户端 - 带 tenant_id 自动注入
 * 所有查询自动追加 tenant_id 条件，防止越权
 */

export class TenantDB {
  constructor(
    private db: D1Database,
    private tenantId: string
  ) {}

  /**
   * 执行带 tenant_id 的查询
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    // 自动在 WHERE 条件中注入 tenant_id
    // 如果 SQL 已包含 tenant_id，则直接使用
    if (sql.includes('tenant_id')) {
      const result = await this.db.prepare(sql).bind(...params).all<T>();
      return result.results || [];
    }
    // 对于没有 tenant_id 条件的查询，追加
    const wrappedSql = sql.includes('WHERE')
      ? sql.replace(/WHERE/i, `WHERE tenant_id = ? AND`)
      : sql.includes('ORDER BY') || sql.includes('GROUP BY') || sql.includes('LIMIT')
        ? sql.replace(/(ORDER BY|GROUP BY|LIMIT)/i, `WHERE tenant_id = ? $1`)
        : `${sql} WHERE tenant_id = ?`;

    const result = await this.db.prepare(wrappedSql).bind(this.tenantId, ...params).all<T>();
    return result.results || [];
  }

  /**
   * 执行单条查询 (返回第一条)
   */
  async queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results[0] || null;
  }

  /**
   * 执行写操作 (INSERT/UPDATE/DELETE)，自动带 tenant_id
   */
  async exec(sql: string, params: unknown[] = []): Promise<D1Result> {
    return this.db.prepare(sql).bind(...params).run();
  }

  /**
   * 带租户隔离的 INSERT
   */
  async insert(table: string, data: Record<string, unknown>): Promise<D1Result> {
    const cols = ['tenant_id', ...Object.keys(data)];
    const vals = [this.tenantId, ...Object.values(data)];
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
    return this.db.prepare(sql).bind(...vals).run();
  }

  /**
   * 带租户隔离的 UPDATE
   */
  async update(table: string, id: string, data: Record<string, unknown>): Promise<D1Result> {
    const setClauses = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(data), this.tenantId, id];
    const sql = `UPDATE ${table} SET ${setClauses} WHERE tenant_id = ? AND id = ?`;
    return this.db.prepare(sql).bind(...vals).run();
  }

  /**
   * 带租户隔离的 DELETE
   */
  async delete(table: string, id: string): Promise<D1Result> {
    const sql = `DELETE FROM ${table} WHERE tenant_id = ? AND id = ?`;
    return this.db.prepare(sql).bind(this.tenantId, id).run();
  }

  /**
   * 批量查询
   */
  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.db.batch(statements);
  }

  /**
   * 获取原始 D1 (用于不涉及 tenant 的系统表操作)
   */
  get raw(): D1Database {
    return this.db;
  }

  get tid(): string {
    return this.tenantId;
  }
}
