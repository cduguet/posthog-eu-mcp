import { ApiPropertyDefinitionSchema } from "./schema/api";
import { withPagination } from "./lib/utils/api";
import type { PostHogFeatureFlag } from "./schema/flags";
import type { PostHogFlagsResponse } from "./schema/flags";
import { PropertyDefinitionSchema } from "./schema/properties";

export async function getFeatureFlagDefinition(projectId: string, flagId: string, apiToken: string) {
	const response = await fetch(`https://us.posthog.com/api/projects/${projectId}/feature_flags/${flagId}/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch feature flag: ${response.statusText}`);
	}
	return response.json();
}
export async function getFeatureFlags(projectId: string, apiToken: string): Promise<PostHogFeatureFlag[]> {
	const response = await fetch(`https://us.posthog.com/api/projects/${projectId}/feature_flags/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
	}
	const data = await response.json() as PostHogFlagsResponse;
	return data.results || [];
}

export async function getOrganizations(apiToken: string) {
	console.log("loading organizations")
	const response = await fetch(`https://us.posthog.com/api/organizations/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch organizations: ${response.statusText}`);
	}
	return response.json();
}

export async function getOrganizationDetails(orgId: string | undefined, apiToken: string) {
	const orgIdToUse = orgId ?? '@current'
	console.log("loading organization details", orgIdToUse)
	const response = await fetch(`https://us.posthog.com/api/organizations/${orgIdToUse}/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch organization details: ${response.statusText}`);
	}
	return response.json();
}

export async function getProjects(orgId: string | undefined, apiToken: string) {
	const orgIdToUse = orgId ?? '@current'
	console.log("loading projects", orgIdToUse)
	const response = await fetch(`https://us.posthog.com/api/organizations/${orgIdToUse}/projects/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch projects: ${response.statusText}`);
	}
	return response.json();
}

export async function getPropertyDefinitions({ projectId, apiToken }: { projectId: string, apiToken: string }) {
	console.log("loading property definitions", projectId)
	const propertyDefinitions = await withPagination(`https://us.posthog.com/api/projects/${projectId}/property_definitions/`, apiToken, ApiPropertyDefinitionSchema);

	const propertyDefinitionsWithoutHidden = propertyDefinitions.filter((def) => !def.hidden);

	return propertyDefinitionsWithoutHidden.map((def) => PropertyDefinitionSchema.parse(def));
}