import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {z} from "zod";

export function registerHealthTool(server: McpServer) {
    server.registerTool('health.ping', {
            title: 'Health Ping',
            description: 'Simple ping tool to verify the server is alive',
            inputSchema: {},
        },
        async () => {
            return {

                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify({ok: true, ts: new Date().toISOString()})
                    }
                ]
            }
        }
    )
}
