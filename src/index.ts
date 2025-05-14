import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFeatureFlagDefinition, getFeatureFlags, getOrganizationDetails, getOrganizations, getProjects, getPropertyDefinitions } from "./posthogApi";


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
				projectId: z.string(),
				flagId: z.string().optional(),
				flagName: z.string().optional(),
			},
			async ({ projectId, flagId, flagName }) => {
				const posthogToken = this.env.POSTHOG_API_TOKEN;

				if (!flagId && !flagName) {
					return { content: [{ type: "text", text: "Error: Either flagId or flagName must be provided." }] };
				}

				try {
					let flagDefinition: any;

					if (flagId) {
						flagDefinition = await getFeatureFlagDefinition(projectId, String(flagId), posthogToken);
						return { content: [{ type: "text", text: JSON.stringify(flagDefinition) }] };
					}

					if (flagName) {
						const allFlags = await getFeatureFlags(projectId, posthogToken);
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
		this.server.tool(
			"organizations-get",
			{},
			async () => {
				try {
					const organizations = await getOrganizations(this.env.POSTHOG_API_TOKEN);
					console.log("organizations", organizations);
					return { content: [{ type: "text", text: JSON.stringify(organizations) }] };
				} catch (error) {
					console.error("Error fetching organizations:", error);
					return { content: [{ type: "text", text: "Error fetching organizations" }] };
				}
			}
		);

		this.server.tool(
			"organization-details-get",
			{
				orgId: z.string().optional(),
			},
			async ({ orgId }) => {
				try {
					const organizationDetails = await getOrganizationDetails(orgId, this.env.POSTHOG_API_TOKEN);
					console.log("organization details", organizationDetails);
					return { content: [{ type: "text", text: JSON.stringify(organizationDetails) }] };
				} catch(error) {
					console.error("Error fetching organization details:", error);
					return { content: [{ type: "text", text: "Error fetching organization details" }] };
				}
			}
		);

		this.server.tool(
			"projects-get",
			{
				orgId: z.string().optional(),
			},
			async ({ orgId }) => {
				try {
					const projects = await getProjects(orgId, this.env.POSTHOG_API_TOKEN);
					console.log("projects", projects);
					return { content: [{ type: "text", text: JSON.stringify(projects) }] };
				} catch (error) {
					console.error("Error fetching projects:", error);
					return { content: [{ type: "text", text: "Error fetching projects" }] };
				}
			}

		);

		this.server.tool(
			"property-definitions",
			{
				projectId: z.string(),
			},
			async ({ projectId }) => {
				const propertyDefinitions = await getPropertyDefinitions({ projectId: projectId, apiToken: this.env.POSTHOG_API_TOKEN });
				return { content: [{ type: "text", text: JSON.stringify(propertyDefinitions) }] };
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
