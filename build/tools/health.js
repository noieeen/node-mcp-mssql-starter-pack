export function registerHealthTool(server) {
    server.registerTool('health.ping', {
        title: 'Health Ping',
        description: 'Simple ping tool to verify the server is alive',
        inputSchema: {},
        // outputSchema: {
        //     content: z.array(z.object({
        //         ok: z.boolean(),
        //         ts: z.string()
        //     })) 
        // }
    }, async () => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ ok: true, ts: new Date().toISOString() })
                }
            ]
        };
    });
}
