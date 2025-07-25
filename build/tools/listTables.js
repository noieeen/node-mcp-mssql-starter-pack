import { getTables } from '../schemaCache.js';
import { z } from "zod";
export function registerListTablesTool(server) {
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
        inputSchema: {
            schema_filter: z.string().optional().describe("Optional schema name to filter by"),
            table_name: z.string().optional().describe("Optional table name to filter by")
        },
    }, async ({ schema_filter, table_name }) => {
        try {
            const tables = await getTables();
            const filteredSchema = schema_filter
                ? tables.filter(t => t.schema === schema_filter)
                : tables;
            let filteredTable = filteredSchema;
            if (table_name) {
                const regex = new RegExp(table_name, 'i'); // case-insensitive match
                filteredTable = filteredSchema.filter(t => regex.test(t.table));
            }
            return {
                content: [{
                        type: "text",
                        text: `Found ${filteredTable.length} tables:\n\n${filteredTable.map(t => `${t.schema}.${t.table}`).join('\n')}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error listing tables: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
}
