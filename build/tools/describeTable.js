import { getTableColumns } from "../schemaCache.js";
import { z } from "zod";
export function registerDescribeTableTool(server) {
    server.registerTool("sql.describe_table", {
        title: "Describe table",
        description: "Get column info for a table",
        inputSchema: {
            table: z.string().min(1).describe("The table to describe"),
        },
        outputSchema: z.object({
            table: z.string(),
            column: z.string(),
            type: z.string(),
            nullable: z.boolean(),
        }),
    }, async ({ table }) => {
        return getTableColumns(table);
    });
}
