## Environment variables

- Create `.dev.vars` in the root
- Add Inkeep API key to enable `docs-search` tool (see `Inkeep API key - mcp`)


```
INKEEP_API_KEY="..."
```

## PostHog API Key

Obtain a [personal API key](https://posthog.com/docs/api#how-to-obtain-a-personal-api-key) on PostHog with appropriate permissions (project or organization scoped, at least read access, though some tools require write access).

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