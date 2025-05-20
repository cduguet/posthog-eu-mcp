# PostHog MCP

## 1. Running locally

### 1.1 Environment variables

- Create `.dev.vars` in the root
- Add Inkeep API key to enable `docs-search` tool (see `Inkeep API key - mcp`)


```
INKEEP_API_KEY="..."
```

### 1.2 PostHog API Key

- Obtain a [personal API key](https://posthog.com/docs/api#how-to-obtain-a-personal-api-key) on PostHog with appropriate permissions
- Use the key in your MCP configuration JSON 

### 1.3 MCP configuration for desktop clients (e.g. Cursor, Claude Desktop)

```json
{
  "mcpServers": {
    "local-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.posthog.com/sse",
        "--header",
        "Authorization:${POSTHOG_API_TOKEN}"
      ],
      "env": {
        "POSTHOG_API_TOKEN": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```
