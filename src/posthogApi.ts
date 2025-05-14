export async function getFeatureFlagDefinition(flag: string, apiToken: string) {
	const response = await fetch(`https://us.posthog.com/api/projects/99423/feature_flags/${flag}/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch feature flag: ${response.statusText}`);
	}
	return response.json();
}

interface PostHogFeatureFlag {
	id: number;
	key: string;
	name: string;
}

interface PostHogFlagsResponse {
	results?: PostHogFeatureFlag[];
}

export async function getFeatureFlags(apiToken: string): Promise<PostHogFeatureFlag[]> {
	const response = await fetch(`https://us.posthog.com/api/projects/99423/feature_flags/`, {
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
	const response = await fetch(`https://us.posthog.com/api/organizations/`, {
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

export async function getProjects(orgId: string, apiToken: string) {
	const response = await fetch(`https://us.posthog.com/api/organizations/${orgId}/projects/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch projects: ${response.statusText}`);
	}
	return response.json();
}
