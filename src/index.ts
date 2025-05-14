import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFeatureFlagDefinition, getFeatureFlags } from "./posthogApi";

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		this.server.tool(
			"feature-flag-get-definition",
			{
				flagId: z.string().optional(),
				flagName: z.string().optional(),
			},
			async ({ flagId, flagName }) => {
				const posthogToken = this.env.POSTHOG_API_TOKEN;

				if (!flagId && !flagName) {
					return { content: [{ type: "text", text: "Error: Either flagId or flagName must be provided." }] };
				}

				try {
					let flagDefinition: any;

					if (flagId) {
						flagDefinition = await getFeatureFlagDefinition(String(flagId), posthogToken);
						return { content: [{ type: "text", text: JSON.stringify(flagDefinition) }] };
					} 
					
					if (flagName) {
						const allFlags = await getFeatureFlags(posthogToken);
						const foundFlag = allFlags.find(f => f.key === flagName);
						if (foundFlag) {
							return { content: [{ type: "text", text: JSON.stringify(foundFlag) }] };
						} else {
							return { content: [{ type: "text", text: `Error: Flag with name "${flagName}" not found.` }] };
						}
					}

					return { content: [{ type: "text", text: "Error: Could not determine or find the feature flag." }] };
				} catch (error: any) {
					console.error("Error in feature-flag-get-definition tool:", error);
					return { content: [{ type: "text", text: `Error: ${error.message || "Failed to process feature flag request"}` }] };
				}
			}
		);	
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const token = url.searchParams.get("token");

		if (!token) {
			return new Response("Unauthorized", { status: 401 });
		}

		env["POSTHOG_API_TOKEN"] = token;

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			// @ts-ignore
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			// @ts-ignore
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
