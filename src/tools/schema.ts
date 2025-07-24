import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {clearSchemaCache, getSchemaStats} from '../schemaCache.js';

export function registerSchemaTool(server: McpServer) {
    server.registerTool('sql.clear_schema_cache', {
        title: 'Clear schema cache',
        description: 'Clear the schema cache (useful for testing or when schema changes)',
    }, () => {
        try {
            clearSchemaCache();
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify({ok: true, ts: new Date().toISOString()})
                    }
                ],

            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Error during schema cache clear: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }

    });

    server.registerTool('sql.get_schema_stats', {
        title: 'Show schema stats',
        description: 'Get schema stats(table count, total columns, average columns per table)',
    }, async () => {
        try {
            const statsResult = await getSchemaStats();
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(statsResult, null, 2)
                    }
                ],

            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Error during get schema stats: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }

    });
}