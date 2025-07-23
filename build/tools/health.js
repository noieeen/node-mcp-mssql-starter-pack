import { z } from "zod";
export function registerHealthTool(server) {
    server.registerTool('health.ping', {
        title: 'Health Ping',
        description: 'Simple ping tool to verify the server is alive',
        inputSchema: { type: z.object({}) },
    }, async () => ({ ok: true, ts: new Date().toISOString() }));
}
