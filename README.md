# Node MCP Server for MSSQL

Quick starter to expose safe SQL tools over the Model Context Protocol (MCP).

## Quick Start

```bash
pnpm install        # or npm i / yarn
cp .env.example .env
pnpm dev            # or: npx tsx src/server.ts
```

Point your MCP client (Claude Desktop, custom client, etc.) to this server via stdio or TCP.

## Tools Exposed
- `health.ping`
- `sql.list_tables`
- `sql.describe_table`
- `sql.query` (read-only)

See `src/tools/*` for implementations.
