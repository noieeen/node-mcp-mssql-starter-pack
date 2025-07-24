import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSqlQueryTool } from "./tools/sqlQuery.js";
import { registerDescribeTableTool } from "./tools/describeTable.js";
import { registerListTablesTool } from "./tools/listTables.js";
import { registerHealthTool } from "./tools/health.js";
import { logger } from "./utils/logger.js";
import { registerSchemaTool } from "./tools/schema.js";
async function main() {
    const transportType = process.env.MCP_TRANSPORT ?? "stdio";
    const transport = new StdioServerTransport();
    const server = new McpServer({ name: "node-mcp-mssql", version: "0.1.0" });
    registerSchemaTool(server);
    registerHealthTool(server);
    registerListTablesTool(server);
    registerDescribeTableTool(server);
    registerSqlQueryTool(server);
    await server.connect(transport);
    logger.info(`MCP server started using ${transportType} transport`);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
