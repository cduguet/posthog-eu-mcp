import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
	createFeatureFlag,
	deleteFeatureFlag,
	errorDetails,
	getFeatureFlagDefinition,
	getFeatureFlags,
	getOrganizationDetails,
	getOrganizations,
	getProjects,
	getPropertyDefinitions,
	getSqlInsight,
	listErrors,
	updateFeatureFlag,
} from "./posthogApi";

import { FilterGroupsSchema, UpdateFeatureFlagInputSchema } from "./schema/flags";

import { docsSearch } from "./inkeepApi";
import { extractDataFromSSEStream } from "./lib/utils/streaming";
import { hash } from "./lib/utils/helper-functions";
import { MemoryCache } from "./lib/utils/cache/MemoryCache";
import { ErrorDetailsSchema, ListErrorsSchema } from "./schema/errors";

const INSTRUCTIONS = `
- You are a helpful assistant that can query PostHog API.
- If some resource from another tool is not found, ask the user if they want to try finding it in another project.
- If you cannot answer the user's PostHog related request or question using other available tools in this MCP, use the 'docs-search' tool to provide information from the documentation to guide user how they can do it themselves - when doing so provide condensed instructions with links to sources.
`;

type State = {
	projectId: string | undefined;
	orgId: string | undefined;
};
// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "PostHog MCP",
		version: "1.0.0",
		instructions: INSTRUCTIONS,
	});

	initialState: State = {
		projectId: undefined,
		orgId: undefined,
	};

	cache = new MemoryCache<State>(this.env.USER_HASH);

	async getOrgID() {
		const orgId = await this.cache.get("orgId");

		if (!orgId) {
			const orgs = await getOrganizations(this.env.POSTHOG_API_TOKEN);

			// If there is only one org, set it as the active org
			if (orgs.length === 1) {
				await this.cache.set("orgId", orgs[0].id);
				return orgs[0].id;
			}

			return "@current";
		}

		return orgId;
	}

	async getProjectId() {
		const projectId = await this.cache.get("projectId");

		if (!projectId) {
			const orgId = await this.getOrgID();
			const projects = await getProjects(orgId, this.env.POSTHOG_API_TOKEN);

			// If there is only one project, set it as the active project
			if (projects.length === 1) {
				await this.cache.set("projectId", projects[0].id);
				return projects[0].id;
			}

			return "@current";
		}

		return projectId;
	}

	async init() {
		this.server.tool(
			"feature-flag-get-definition",
			`
				- Use this tool to get the definition of a feature flag. 
				- You can provide either the flagId or the flagName. 
				- If you provide both, the flagId will be used.
			`,
			{
				flagId: z.string().optional(),
				flagName: z.string().optional(),
			},
			async ({ flagId, flagName }) => {
				const posthogToken = this.env.POSTHOG_API_TOKEN;

				if (!flagId && !flagName) {
					return {
						content: [
							{
								type: "text",
								text: "Error: Either flagId or flagName must be provided.",
							},
						],
					};
				}

				try {
					let flagDefinition: any;

					const projectId = await this.getProjectId();
					if (flagId) {
						flagDefinition = await getFeatureFlagDefinition(
							projectId,
							String(flagId),
							posthogToken,
						);
						return {
							content: [{ type: "text", text: JSON.stringify(flagDefinition) }],
						};
					}

					if (flagName) {
						const allFlags = await getFeatureFlags(projectId, posthogToken);
						const foundFlag = allFlags.find((f) => f.key === flagName);
						if (foundFlag) {
							return { content: [{ type: "text", text: JSON.stringify(foundFlag) }] };
						}
						return {
							content: [
								{
									type: "text",
									text: `Error: Flag with name "${flagName}" not found.`,
								},
							],
						};
					}

					return {
						content: [
							{
								type: "text",
								text: "Error: Could not determine or find the feature flag.",
							},
						],
					};
				} catch (error: any) {
					console.error("Error in feature-flag-get-definition tool:", error);
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error.message || "Failed to process feature flag request"}`,
							},
						],
					};
				}
			},
		);

		this.server.tool(
			"feature-flag-get-all",
			`
				- Use this tool to get all feature flags in the project.
			`,
			{},
			async () => {
				const projectId = await this.getProjectId();

				const allFlags = await getFeatureFlags(projectId, this.env.POSTHOG_API_TOKEN);

				return { content: [{ type: "text", text: JSON.stringify(allFlags) }] };
			},
		);

		this.server.tool(
			"docs-search",
			`
				- Use this tool to search the PostHog documentation for information that can help the user with their request. 
				- Use it as a fallback when you cannot answer the user's request using other tools in this MCP.
			`,
			{
				query: z.string(),
			},
			async ({ query }) => {
				const inkeepApiKey = this.env.INKEEP_API_KEY;

				try {
					if (!inkeepApiKey) {
						return {
							content: [
								{ type: "text", text: "Error: INKEEP_API_KEY is not configured." },
							],
						};
					}
					const resultText = await docsSearch(inkeepApiKey, query);
					return { content: [{ type: "text", text: resultText }] };
				} catch (error: any) {
					console.error("Error in docs-search tool:", error);
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error.message || "Failed to process docs search request"}`,
							},
						],
					};
				}
			},
		);
		this.server.tool("organizations-get", {}, async () => {
			try {
				const organizations = await getOrganizations(this.env.POSTHOG_API_TOKEN);
				console.log("organizations", organizations);
				return { content: [{ type: "text", text: JSON.stringify(organizations) }] };
			} catch (error) {
				console.error("Error fetching organizations:", error);
				return { content: [{ type: "text", text: "Error fetching organizations" }] };
			}
		});

		this.server.tool(
			"project-set-active",
			{
				projectId: z.string(),
			},
			async ({ projectId }) => {
				await this.cache.set("projectId", projectId);

				return { content: [{ type: "text", text: `Switched to project ${projectId}` }] };
			},
		);

		this.server.tool(
			"organization-set-active",
			{
				orgId: z.string(),
			},
			async ({ orgId }) => {
				await this.cache.set("orgId", orgId);

				return { content: [{ type: "text", text: `Switched to organization ${orgId}` }] };
			},
		);

		this.server.tool("organization-details-get", {}, async () => {
			try {
				const orgId = await this.getOrgID();

				const organizationDetails = await getOrganizationDetails(
					orgId,
					this.env.POSTHOG_API_TOKEN,
				);
				console.log("organization details", organizationDetails);
				return {
					content: [{ type: "text", text: JSON.stringify(organizationDetails) }],
				};
			} catch (error) {
				console.error("Error fetching organization details:", error);
				return {
					content: [{ type: "text", text: "Error fetching organization details" }],
				};
			}
		});

		this.server.tool(
			"projects-get",
			`
				- Fetches projects that the user has access to - the orgId is optional. 
				- Use this tool before you use any other tools (besides organization-* and docs-search) to allow user to select the project they want to use for subsequent requests.
			`,
			{},
			async () => {
				try {
					const orgId = await this.getOrgID();
					const projects = await getProjects(orgId, this.env.POSTHOG_API_TOKEN);
					console.log("projects", projects);
					return { content: [{ type: "text", text: JSON.stringify(projects) }] };
				} catch (error) {
					console.error("Error fetching projects:", error);
					return { content: [{ type: "text", text: "Error fetching projects" }] };
				}
			},
		);

		this.server.tool("property-definitions", {}, async () => {
			const projectId = await this.getProjectId();

			const propertyDefinitions = await getPropertyDefinitions({
				projectId: projectId,
				apiToken: this.env.POSTHOG_API_TOKEN,
			});
			return { content: [{ type: "text", text: JSON.stringify(propertyDefinitions) }] };
		});

		this.server.tool(
			"create-feature-flag",
			`Creates a new feature flag in the project. Once you have created a feature flag, you should:
			 - Ask the user if they want to add it to their codebase
			 - Use the "search-docs" tool to find documentation on how to add feature flags to the codebase (search for the right language / framework)
			 - Clarify where it should be added and then add it.
			`,
			{
				name: z.string(),
				key: z.string(),
				description: z.string(),
				filters: FilterGroupsSchema,
				active: z.boolean(),
			},
			async ({ name, key, description, filters, active }) => {
				const projectId = await this.getProjectId();

				const featureFlag = await createFeatureFlag({
					projectId: projectId,
					apiToken: this.env.POSTHOG_API_TOKEN,
					data: { name, key, description, filters, active },
				});
				return { content: [{ type: "text", text: JSON.stringify(featureFlag) }] };
			},
		);

		this.server.tool(
			"list-errors",
			{
				data: ListErrorsSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();

					const errors = await listErrors({
						projectId: projectId,
						data: data,
						apiToken: this.env.POSTHOG_API_TOKEN,
					});
					const results = (errors as any).results;
					console.log("errors results", results);
					return { content: [{ type: "text", text: JSON.stringify(results) }] };
				} catch (error) {
					console.error("Error fetching errors:", error);
					return { content: [{ type: "text", text: "Error fetching errors" }] };
				}
			},
		);

		this.server.tool(
			"error-details",
			{
				data: ErrorDetailsSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();

					const errors = await errorDetails({
						projectId: projectId,
						data: data,
						apiToken: this.env.POSTHOG_API_TOKEN,
					});
					const results = (errors as any).results;
					console.log("error details results", results);
					return { content: [{ type: "text", text: JSON.stringify(results) }] };
				} catch (error) {
					console.error("Error fetching error details:", error);
					return { content: [{ type: "text", text: "Error fetching error details" }] };
				}
			},
		);

		this.server.tool(
			"update-feature-flag",
			`Update a new feature flag in the project.
			- To enable a feature flag, you should make sure it is active and the rollout percentage is set to 100 for the group you want to target.
			- To disable a feature flag, you should make sure it is inactive, you can keep the rollout percentage as it is.
			`,
			{
				flagKey: z.string(),
				data: UpdateFeatureFlagInputSchema,
			},
			async ({ flagKey, data }) => {
				const projectId = await this.getProjectId();

				const featureFlag = await updateFeatureFlag({
					projectId: projectId,
					apiToken: this.env.POSTHOG_API_TOKEN,
					key: flagKey,
					data: data,
				});
				return { content: [{ type: "text", text: JSON.stringify(featureFlag) }] };
			},
		);

		this.server.tool(
			"delete-feature-flag",
			{
				flagKey: z.string(),
			},
			async ({ flagKey }) => {
				const projectId = await this.getProjectId();

				const allFlags = await getFeatureFlags(projectId, this.env.POSTHOG_API_TOKEN);

				const flag = allFlags.find((f) => f.key === flagKey);

				if (!flag) {
					return {
						content: [{ type: "text", text: "Feature flag is already deleted." }],
					};
				}

				const featureFlag = await deleteFeatureFlag({
					projectId: projectId,
					apiToken: this.env.POSTHOG_API_TOKEN,
					flagId: flag.id,
				});

				return { content: [{ type: "text", text: JSON.stringify(featureFlag) }] };
			},
		);

		this.server.tool(
			"get-sql-insight",
			`
				- Queries project's PostHog data warehouse based on a provided natural language question - don't provide SQL query as input but describe the output you want.
				- Data warehouse schema includes data like events and persons.
				- Use this tool to get a quick answer to a question about the data in the project, which can't be answered using other, more dedicated tools.
				- Fetches the result as a Server-Sent Events (SSE) stream and provides the concatenated data content.
				- When giving the results back to the user, first show the SQL query that was used, then briefly explain the query, then provide results in reasily readable format.
			`,
			{
				query: z
					.string()
					.max(1000)
					.describe(
						"Your natural language query describing the SQL insight (max 1000 characters).",
					),
			},
			async ({ query }) => {
				const apiToken = this.env.POSTHOG_API_TOKEN;
				if (!apiToken) {
					return {
						content: [
							{ type: "text", text: "Error: POSTHOG_API_TOKEN is not configured." },
						],
					};
				}

				try {
					const projectId = await this.getProjectId();

					const sseStream = await getSqlInsight({ projectId, apiToken, query });
					const extractedData = await extractDataFromSSEStream(sseStream);
					console.log("extractedData", extractedData);
					if (extractedData.length === 0) {
						return {
							content: [
								{
									type: "text",
									text: "Received an empty SQL insight or no data in the stream.",
								},
							],
						};
					}
					return { content: [{ type: "text", text: extractedData }] };
				} catch (error: any) {
					console.error("Error in get-sql-insight tool:", error);
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error.message || "Failed to generate SQL insight"}`,
							},
						],
					};
				}
			},
		);

		// 	this.server.prompt("add-feature-flag-to-codebase", "Use this prompt to add a feature flag to the codebase", async ({
		// 	}) => {
		// 		return `Follow these steps to add a feature flag to the codebase:
		// 		1. Ask the user what flag they want to add if it is not already obvious.
		// 		2. Search for that flag, if it does not exist, create it.
		// 		3. Search the docs for the right language / framework on how to add a feature flag - make sure you get the docs you need.
		// 		4. Gather any context you need on how flags are used in the codebase.
		// 		5. Add the feature flag to the codebase.
		// 		`
		// 	})
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const token = url.searchParams.get("token");

		if (!token) {
			return new Response("Unauthorized", { status: 401 });
		}

		const userHash = hash(token);

		env.POSTHOG_API_TOKEN = token;
		env.USER_HASH = userHash;

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
