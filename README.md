## MCP configuration for desktop clients (e.g. Cursor, Claude Desktop)

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse?token={YOUR_POSTHOG_API_KEY}"
      ]
    }
  }
}
```