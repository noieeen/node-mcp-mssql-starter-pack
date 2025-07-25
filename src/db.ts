import sql from 'mssql';
import { logger } from './utils/logger.js';

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool) return pool;
  pool = await new sql.ConnectionPool({
    server: process.env.MSSQL_SERVER!,
    port: Number(process.env.MSSQL_PORT ?? 1433),
    user: process.env.MSSQL_USER!,
    password: process.env.MSSQL_PASSWORD!,
    database: process.env.MSSQL_DATABASE!,
    options: {
      encrypt: process.env.MSSQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
    }
  }).connect();
  logger.info('MSSQL pool connected');
  return pool;
}

export async function query<T = any>(q: string, params?: Record<string, unknown>,limit?: number): Promise<T[]> {
  if (limit && /^select\s+/i.test(q.trim())) {
    q = q.replace(/^select\s+/i, `SELECT TOP (${limit}) `);
  }
  const p = await getPool();
  const request = p.request();
  if (params) {
    for (const [k, v] of Object.entries(params)) request.input(k, v as any);
  }
  const res = await request.query<T>(q);
  return res.recordset ?? [];
}

