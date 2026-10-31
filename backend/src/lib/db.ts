/** Shared PostgreSQL access. One pool per API process, dedicated client per transaction. */
import 'dotenv/config';
import pg, {type PoolClient, type QueryResultRow} from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL chưa được cấu hình. Xem .env.example và README.md');
}

// Node-postgres returns NUMERIC and COUNT(*) as strings by default. PawCare's
// prices/weights/IDs remain inside JavaScript's safe numeric range.
pg.types.setTypeParser(1700, value => Number(value));
pg.types.setTypeParser(20, value => Number(value));
// DATE should remain YYYY-MM-DD, not become a timezone-dependent Date object.
pg.types.setTypeParser(1082, value => value);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // SQL date/time inputs produced by PawCare are in UTC.
  options: '-c timezone=UTC',
});
pool.on('error', error => console.error('[postgres idle connection]', error));

export type DB = pg.Pool | PoolClient;
const activeTransaction = new AsyncLocalStorage<PoolClient>();

// Existing repository used SQLite '?' positional placeholders. Translate only
// code-owned SQL, never user data (all values are bound separately via pg).
export function pgSql(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function connection(db?: DB): DB { return db ?? activeTransaction.getStore() ?? pool; }
export async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = [], db?: DB): Promise<T[]> {
  const result = await connection(db).query<T & QueryResultRow>(pgSql(sql), params);
  return result.rows as T[];
}
export async function exec(sql: string, params: unknown[] = [], db?: DB): Promise<{insertId: number; affectedRows: number}> {
  const isInsert = /^\s*INSERT\s+INTO\b/i.test(sql);
  const text = isInsert && !/\bRETURNING\b/i.test(sql) ? `${sql.trim().replace(/;$/, '')} RETURNING *` : sql;
  const result = await connection(db).query(pgSql(text), params);
  const first = result.rows[0];
  return {insertId: Number(first?.id ?? first?.user_id ?? 0), affectedRows: result.rowCount ?? 0};
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await activeTransaction.run(client, () => work(client));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (rollbackError) { console.error('[postgres rollback]', rollbackError); }
    throw error;
  } finally {
    client.release();
  }
}
/** Serialize booking changes for one staff member across ALL API instances. */
export async function lockStaff(client: DB, staffIds: Array<number | null | undefined>) {
  const ids = [...new Set(staffIds.filter((id): id is number => Number.isSafeInteger(id) && Number(id) > 0))].sort((a, b) => a - b);
  for (const id of ids) await client.query('SELECT pg_advisory_xact_lock($1, $2)', [42371, id]);
}
