import { getTables, tableExists } from '../schemaCache.js';
import { z } from "zod";
import { query } from "../db.js";
export function registerListTablesTool(server) {
    // List tables with optional filters
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
        inputSchema: {
            schema_filter: z.string().optional().describe("Optional schema name to filter by"),
            table_name: z.string().optional().describe("Optional table name to filter by")
        },
    }, async ({ schema_filter, table_name }) => {
        try {
            let filtered = await getTables();
            if (schema_filter) {
                filtered = filtered.filter(t => t.schema === schema_filter);
            }
            if (table_name) {
                const regex = new RegExp(table_name, 'i');
                filtered = filtered.filter(t => regex.test(t.table));
            }
            return {
                content: [{
                        type: "text",
                        text: `Found ${filtered.length} tables:\n\n${filtered.map(t => `${t.schema}.${t.table}`).join('\n')}`
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
    // Get sample rows to understand table content
    server.registerTool("sql.sample_data", {
        title: "Get sample data from table",
        description: "Get a few sample rows from a table to understand its structure and content",
        inputSchema: {
            table_name: z.string().describe("The table name to sample from"),
            limit: z.number().min(1).max(100).default(5).describe("Number of sample rows to return")
        }
    }, async ({ table_name, limit }) => {
        try {
            if (!await tableExists(table_name)) {
                throw new Error(`Table '${table_name}' does not exist`);
            }
            const [schema, rawTable] = table_name.includes('.') ? table_name.split('.') : ['dbo', table_name];
            const safeTableName = `[${schema.replace(/[\[\]]/g, '')}].[${rawTable.replace(/[\[\]]/g, '')}]`;
            const results = await query(`SELECT TOP(@limit) *
                     FROM ${safeTableName}`, { limit });
            return {
                content: [{
                        type: "text",
                        text: `Sample data from ${table_name} (${results.length} rows):\n\n${JSON.stringify(results, null, 2)}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error sampling data: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
}
