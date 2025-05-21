# PostHog MCP

## Use the MCP Server

1. Obtain a [personal API key](https://posthog.com/docs/api#how-to-obtain-a-personal-api-key) on PostHog with appropriate permissions

2. Add the MCP configuration to your desktop client (e.g. Cursor, Windsurf, Claude Desktop) and add your personal API key

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
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


**Here are some examples of prompts you can use:**
- What feature flags do I have active?
- Add a new feature flag for our homepage redesign
- What are my most common errors?

## Running locally

### Environment variables

- Create `.dev.vars` in the root
- Add Inkeep API key to enable `docs-search` tool (see `Inkeep API key - mcp`)


```
INKEEP_API_KEY="..."
```

