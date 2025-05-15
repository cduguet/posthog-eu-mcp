import { ApiPropertyDefinitionSchema } from "./schema/api";
import { withPagination } from "./lib/utils/api";
import { type CreateFeatureFlagInput, type FeatureFlag, type PostHogFeatureFlag } from "./schema/flags";
import type { PostHogFlagsResponse, UpdateFeatureFlagInput } from "./schema/flags";
import { PropertyDefinitionSchema } from "./schema/properties";
import type { Project } from "./schema/projects";

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

export async function getProjects(orgId: string | undefined, apiToken: string): Promise<Project[]> {
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

export async function createFeatureFlag({ projectId, apiToken, data }: { projectId: string, apiToken: string, data: CreateFeatureFlagInput }) {
	console.log("creating feature flag for project", projectId, data)
	const body = { "key": data.key, "name": data.name, "description": data.description, "active": data.active, "filters": data.filters }

	const response = await fetch(`https://us.posthog.com/api/projects/${projectId}/feature_flags/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	});



	if (!response.ok) {

		const responseData = await response.json() as { type?: string, code?: string };

		if (responseData.type === "validation_error" && responseData.code === "unique") {
			throw new Error("Feature flag already exists with this key");
		}

		throw new Error(`Failed to create feature flag: ${response.statusText}`);
	}

	const responseData = await response.json();

	return responseData;
}

export async function listErrors({ projectId, apiToken }: { projectId: string, apiToken: string | undefined }) {
	console.log("listing errors for project", projectId)
	const date = new Date()
	date.setDate(date.getDate() - 7)
	const dateFromToUse = date.toISOString()
	const dateToToUse = new Date().toISOString()
	console.log("dateFromToUse", dateFromToUse)
	console.log("dateToToUse", dateToToUse)
	const body = {
		"query": {
			"kind": "ErrorTrackingQuery",
			"orderBy": "occurrences",
			"status": "active",
			"dateRange": {
				"date_from": dateFromToUse,
				"date_to": dateToToUse
			},
			"volumeResolution": 20
		}
	}

	const response = await fetch(`https://us.posthog.com/api/environments/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	});


	if (!response.ok) {
		throw new Error(`Failed to fetch errors: ${response.statusText}`);
	}
	const responseData = await response.json();

	return responseData;
}

export async function updateFeatureFlag({ projectId, apiToken, key, data }: { projectId: string, apiToken: string, key: string, data: UpdateFeatureFlagInput }) {

	const allFlags = await getFeatureFlags(projectId, apiToken);
	const flag = allFlags.find(f => f.key === key);

	if (!flag) {
		throw new Error(`Feature flag not found: ${key}`);
	}

	const body = { "key": key, "name": data.name, "description": data.description, "active": data.active, "filters": data.filters }

	const response = await fetch(`https://us.posthog.com/api/projects/${projectId}/feature_flags/${flag.id}/`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		throw new Error(`Failed to update feature flag: ${response.statusText}`);
	}

	const responseData = await response.json();

	return responseData;
}

export async function deleteFeatureFlag({ projectId, apiToken, flagId }: { projectId: string, apiToken: string, flagId: number }) {
	const response = await fetch(`https://us.posthog.com/api/projects/${projectId}/feature_flags/${flagId}/`, {
		method: "PATCH",
		body: JSON.stringify({ "deleted": true }),
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json"
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to delete feature flag: ${response.statusText}`);
	}

	return {
		success: true,
		message: "Feature flag deleted successfully"
	}
}
