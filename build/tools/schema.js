import { clearSchemaCache, getSchemaStats, tableExists } from '../schemaCache.js';
import { z } from "zod";
export function registerSchemaTool(server) {
    server.registerTool('sql.clear_schema_cache', {
        title: 'Clear schema cache',
        description: 'Clear the schema cache (useful for testing or when schema changes)',
    }, () => {
        try {
            clearSchemaCache();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ ok: true, ts: new Date().toISOString() })
                    }
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error during schema cache clear: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
    // Sum schema stats
    server.registerTool('sql.get_schema_stats', {
        title: 'Show schema stats',
        description: 'Get schema stats(table count, total columns, average columns per table)',
    }, async () => {
        try {
            const statsResult = await getSchemaStats();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(statsResult, null, 2)
                    }
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error during get schema stats: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
    // Table exist check
    server.registerTool('sql.table_exists', {
        title: 'Table exists',
        description: 'Check if a table exists',
        inputSchema: {
            table_name: z.string().min(1).default("CRM_Customer").describe("The table name to check"),
        },
    }, async ({ table_name }) => {
        try {
            const isTableExists = await tableExists(table_name);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ table_name, exists: isTableExists }, null, 2)
                    }
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error during table exists check: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
}
