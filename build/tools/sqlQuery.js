import { query } from '../db.js';
import { z } from "zod";
export function registerSqlQueryTool(server) {
    server.registerTool('sql.query', {
        title: 'Execute SQL Query',
        description: 'Execute a read-only SQL query against MSSQL. NO mutations!',
        inputSchema: {
            sql: z.string().min(1).describe('SELECT-only SQL statement'),
            params: z.object({}).optional().describe('Parameters to pass to the SQL query'),
            limit: z.number().min(1).max(1000).default(100).describe("Maximum number of rows to return")
        },
        // outputSchema: {
        //     type: z.object({
        //         rows: z.array(z.object({})),
        //         rowCount: z.number()
        //     })
        // },
    }, async ({ sql, params, limit }) => {
        if (/(\binsert|update|delete|merge|alter|drop|create\b)/i.test(sql)) {
            throw new Error('Only SELECT queries are allowed.');
        }
        const trimmedQuery = sql.trim().toLowerCase();
        const rows = await query(trimmedQuery, params);
        // Format the response as expected by MCP
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ rows, rowCount: rows.length }, null, 2)
                }
            ]
        };
    });
}
