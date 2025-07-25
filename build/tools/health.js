export function registerHealthTool(server) {
    server.registerTool('health.ping', {
        title: 'Health Ping',
        description: 'Simple ping tool to verify the server is alive',
        inputSchema: {},
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
