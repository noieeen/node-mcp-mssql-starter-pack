import sql from 'mssql';
import { logger } from '../utils/logger.js';
let pool = null;
export async function getPool() {
    var _a;
    if (pool)
        return pool;
    pool = await new sql.ConnectionPool({
        server: process.env.MSSQL_SERVER,
        port: Number((_a = process.env.MSSQL_PORT) !== null && _a !== void 0 ? _a : 1433),
        user: process.env.MSSQL_USER,
        password: process.env.MSSQL_PASSWORD,
        database: process.env.MSSQL_DATABASE,
        options: {
            encrypt: process.env.MSSQL_ENCRYPT === 'true',
            trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
        }
    }).connect();
    logger.info('MSSQL pool connected');
    return pool;
}
export async function query(q, params, limit) {
    var _a;
    if (limit && /^select\s+/i.test(q.trim())) {
        q = q.replace(/^select\s+/i, `SELECT TOP (${limit}) `);
    }
    const p = await getPool();
    const request = p.request();
    if (params) {
        for (const [k, v] of Object.entries(params))
            request.input(k, v);
    }
    const res = await request.query(q);
    return (_a = res.recordset) !== null && _a !== void 0 ? _a : [];
}
