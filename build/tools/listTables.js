import { loadSchema } from '../schemaCache.js';
export function registerListTablesTool(server) {
    server.registerTool('sql.list_tables', {
        title: 'List tables',
        description: 'List available tables and schemas',
    }, async () => {
        const { tables } = await loadSchema();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(tables, null, 2)
                }
            ],
            structured: tables // ✅ now MCP validates this against outputSchema
        };
    });
}
