import { query } from '../db.js';
import { z } from "zod";
export function registerSqlQueryTool(server) {
    server.registerTool('sql.query', {
        title: 'SQL Query',
        description: 'Execute a read-only SQL query against MSSQL. NO mutations!',
        inputSchema: {
            type: z.object,
            required: ['sql'],
            properties: {
                sql: { type: 'string', description: 'SELECT-only SQL statement' },
                params: { type: 'object', additionalProperties: true }
            }
        },
    }, async ({ sql, params }) => {
        if (/(\binsert|update|delete|merge|alter|drop|create\b)/i.test(sql)) {
            throw new Error('Only SELECT queries are allowed.');
        }
        const rows = await query(sql, params);
        return { rows, rowCount: rows.length };
    });
}
