import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {loadSchema} from '../schemaCache.js';
import {z} from "zod";

export function registerListTablesTool(server: McpServer) {
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
    }, async () => {
        const { tables } = await loadSchema();

        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify(tables, null, 2)
                }
            ],
            structured: tables // ✅ now MCP validates this against outputSchema
        };
    });
}