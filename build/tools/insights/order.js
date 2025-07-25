import { getTableColumns } from "../../schemaCache.js";
import { z } from "zod";
export function registerDescribeTableTool(server) {
    server.registerTool("sql.describe_table", {
        title: "Describe table",
        description: "Get column info for a table",
        inputSchema: {
            table_name: z.string().min(3).default("CRM_Customer").describe("The table name to describe"),
        },
    }, async ({ table_name }) => {
        try {
            const columns = await getTableColumns(table_name);
            // Format the response as expected by MCP
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(columns, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error describing table '${table_name}': ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
}
