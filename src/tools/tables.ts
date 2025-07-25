import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {getTables, tableExists, getTableColumns} from '../schemaCache.js';
import {z} from "zod";
import {query} from "../db.js";

export function registerListTablesTool(server: McpServer) {
    // List tables with optional filters
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
        inputSchema: {
            schema_filter: z.string().optional().describe("Optional schema name to filter by"),
            table_name: z.string().optional().describe("Optional table name to filter by")
        },
    }, async ({schema_filter, table_name}) => {
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
                    type: "text" as const,
                    text: `Found ${filtered.length} tables:\n\n${
                        filtered.map(t => `${t.schema}.${t.table}`).join('\n')
                    }`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error listing tables: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                isError: true
            };
        }

    });

    // Comprehensive table info including indexes and constraints

    server.registerTool(
        "sql.get_table_info",
        {
            title: "Get comprehensive table information",
            description: "Get detailed info about a table including columns, indexes, and constraints",
            inputSchema: {
                table_name: z.string().describe("The table name to analyze")
            }
        },
        async ({table_name}) => {
            try {
                const [schema, rawTable] = table_name.includes('.') ? table_name.split('.') : ['dbo', table_name];
                const [columns, indexes, constraints] = await Promise.all([
                    getTableColumns(table_name),
                    query(`
                        SELECT i.name AS INDEX_NAME,
                               c.name AS COLUMN_NAME,
                               i.is_unique AS IS_UNIQUE,
                               i.type_desc AS INDEX_TYPE
                        FROM sys.indexes i
                        JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                        JOIN sys.tables t ON i.object_id = t.object_id
                        JOIN sys.schemas s ON t.schema_id = s.schema_id
                        WHERE t.name = @table_name AND s.name = @schema
                        ORDER BY i.name, ic.key_ordinal
                    `, {table_name: rawTable, schema}),
                    query(`
                        SELECT tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                                 JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                                      ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                        WHERE kcu.TABLE_NAME = @table_name AND kcu.TABLE_SCHEMA = @schema
                    `, {table_name: rawTable, schema})
                ]);

                const info = {
                    table: table_name,
                    columns: columns,
                    indexes: indexes,
                    constraints: constraints,
                    column_count: columns.length
                };

                return {
                    content: [{
                        type: "text" as const,
                        text: `Table Information: ${table_name}\n\n${JSON.stringify(info, null, 2)}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error getting table info: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Get sample rows to understand table content
    server.registerTool(
        "sql.sample_data",
        {
            title: "Get sample data from table",
            description: "Get a few sample rows from a table to understand its structure and content",
            inputSchema: {
                table_name: z.string().describe("The table name to sample from"),
                limit: z.number().min(1).max(100).default(5).describe("Number of sample rows to return")
            }
        },
        async ({table_name, limit}) => {
            try {
                if (!await tableExists(table_name)) {
                    throw new Error(`Table '${table_name}' does not exist`);
                }

                const [schema, rawTable] = table_name.includes('.') ? table_name.split('.') : ['dbo', table_name];
                const safeTableName = `[${schema.replace(/[\[\]]/g, '')}].[${rawTable.replace(/[\[\]]/g, '')}]`;
                const results = await query(
                    `SELECT TOP(@limit) *
                     FROM ${safeTableName}`,
                    {limit}
                );

                return {
                    content: [{
                        type: "text" as const,
                        text: `Sample data from ${table_name} (${results.length} rows):\n\n${JSON.stringify(results, null, 2)}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error sampling data: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    );
}