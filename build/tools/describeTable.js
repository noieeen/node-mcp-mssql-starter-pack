import { getTableColumns } from "../schemaCache.js";
import { z } from "zod";
export function registerDescribeTableTool(server) {
    server.registerTool("sql.describe_table", {
        title: "Describe table",
        description: "Get column info for a table",
        inputSchema: {
            table: z.string().min(1).describe("The table to describe"),
        },
    }, async ({ table }) => {
        const columns = getTableColumns(table);
        // Format the response as expected by MCP
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(columns, null, 2)
                }
            ]
        };
    });
}
