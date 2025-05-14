export async function getFeatureFlagDefinition(projectId: string, flagId: string, apiToken: string) {
	console.log("loading feature flag definition", projectId, flagId)
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
