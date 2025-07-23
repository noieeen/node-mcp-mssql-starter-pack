import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {query} from '../db.js';
import {z} from "zod";

export function registerSqlQueryTool(server: McpServer) {
    server.registerTool('sql.query', {
        title: 'SQL Query',
        description: 'Execute a read-only SQL query against MSSQL. NO mutations!',
        inputSchema: {
            sql: z.string().min(1).describe('SELECT-only SQL statement'),
            params: z.object({}).optional().describe('Parameters to pass to the SQL query'),
        },
        outputSchema: {
            type: z.object({
                rows: z.array(z.object({})),
                rowCount: z.number()
            })
        },
    }, async ({sql, params}) => {
        if (/(\binsert|update|delete|merge|alter|drop|create\b)/i.test(sql)) {
            throw new Error('Only SELECT queries are allowed.');
        }
        const rows = await query(sql, params);
        // Format the response as expected by MCP
        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify({rows, rowCount: rows.length}, null, 2)
                }
            ]
        };
    });
}
