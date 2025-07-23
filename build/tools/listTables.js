import { loadSchema } from '../schemaCache.js';
import { z } from "zod";
export function registerListTablesTool(server) {
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
        inputSchema: { type: z.object({}) },
        outputSchema: {
            type: z.array(z.object({
                schema: z.string(),
                table: z.string()
            }))
        },
    }, async () => {
        const { tables } = await loadSchema();
        // Format the response as expected by MCP
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(tables, null, 2)
                }
            ]
        };
    });
}
