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

export async function getOrganizations(apiToken: string) {
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
