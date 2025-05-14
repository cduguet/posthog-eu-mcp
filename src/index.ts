import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFeatureFlagDefinition } from "./posthogApi";

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				// access token via this.env.POSTHOG_API_TOKEN
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			}
		);

		this.server.tool(
			"feature-flag-get-definition",
			{
				flag: z.string(),
			},
			async ({ flag }) => {
				console.log("this.env", this.env);
				const posthogToken = this.env.POSTHOG_API_TOKEN;
				try {
					const flagDefinition = await getFeatureFlagDefinition(flag, posthogToken);
					console.log("flagDefinition", flagDefinition);
					return { content: [{ type: "text", text: JSON.stringify(flagDefinition) }] };
				} catch (error) {
					console.error("Error fetching feature flag:", error);
					return { content: [{ type: "text", text: "Error fetching feature flag" }] };
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
