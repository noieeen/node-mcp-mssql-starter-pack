import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {loadSchema} from '../schemaCache.js';
import {z} from "zod";

export function registerListTablesTool(server: McpServer) {
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
        inputSchema: {type: z.object({}), properties: {...server}},
        outputSchema: {
            type: z.array(z.object({
                schema: z.string(),
                table: z.string()
            }))
        },


    }, async () => {
        const {tables} = await loadSchema();
        return tables;
    });
}
