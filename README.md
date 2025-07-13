# PostHog MCP

## Use the MCP Server

### Quick install

You can install the MCP server automatically into popular clients by running the following command:

```
npx @posthog/wizard@latest mcp add
```

### Manual install

1. Obtain a personal API key using the MCP Server preset [here](https://app.posthog.com/settings/user-api-keys?preset=mcp_server).

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
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```


**Here are some examples of prompts you can use:**
- What feature flags do I have active?
- Add a new feature flag for our homepage redesign
- What are my most common errors?

## Usage

To run the project, use the following command:

```bash
POSTHOG_API_KEY=<YOUR_POSTHOG_API_KEY> npx github:cduguet/posthog-eu-mcp
```

