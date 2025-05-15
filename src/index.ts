import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createFeatureFlag, getFeatureFlagDefinition, getFeatureFlags, getOrganizationDetails, getOrganizations, getProjects, getPropertyDefinitions, listErrors } from "./posthogApi";
import { FilterGroupsSchema } from "./schema/flags";
import { docsSearch } from "./inkeepApi";

interface Env {
	POSTHOG_API_TOKEN: string;
	INKEEP_API_KEY: string;
}

const INSTRUCTIONS = `
- You are a helpful assistant that can query PostHog API.
- Before using any of the tools, clarify which project the user wants to query - use the 'projects-get' tool - it doesn't require the orgId arg.
- Then return the full list of project names and IDs and ask the user to select one. 
- Keep this project ID in scope unless the user asks to change.
- If some resource from another tool is not found, ask the user if they want to try finding it in another project.
- If you cannot answer the user's PostHog related request or question using other available tools in this MCP, use the 'docs-search' tool to provide information from the documentation to guide user how they can do it themselves - when doing so provide condensed instructions with links to sources.
`

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "PostHog MCP",
		version: "1.0.0",
		instructions: INSTRUCTIONS,
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
			"docs-search",
			{
				query: z.string(),
			},
			async ({ query }) => {
				const inkeepApiKey = this.env.INKEEP_API_KEY;

				try {
					if (!inkeepApiKey) {
						return { content: [{ type: "text", text: "Error: INKEEP_API_KEY is not configured." }] };
					}
					const resultText = await docsSearch(inkeepApiKey, query);
					return { content: [{ type: "text", text: resultText }] };
				} catch (error: any) {
					console.error("Error in docs-search tool:", error);
					return { content: [{ type: "text", text: `Error: ${error.message || "Failed to process docs search request"}` }] };
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
				} catch (error) {
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

		this.server.tool(
			"create-feature-flag",
			{
				name: z.string(),
				key: z.string(),
				description: z.string(),
				filters: FilterGroupsSchema,
				active: z.boolean(),
				projectId: z.string(),
			},
			async ({ name, key, description, filters, active, projectId }) => {

				const featureFlag = await createFeatureFlag({ projectId: projectId, apiToken: this.env.POSTHOG_API_TOKEN, data: { name, key, description, filters, active } });
				return { content: [{ type: "text", text: JSON.stringify(featureFlag) }] };
			}
		);

		this.server.tool(
			"list-errors",
			{
				projectId: z.string(),
			},
				async ({ projectId }) => {

				try {
					const errors = await listErrors({ projectId: projectId, apiToken: this.env.POSTHOG_API_TOKEN });
					const results = (errors as any).results
					console.log("errors results", results);
					return { content: [{ type: "text", text: JSON.stringify(results) }] };
				} catch (error) {
					console.error("Error fetching errors:", error);
					return { content: [{ type: "text", text: "Error fetching errors" }] };
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
