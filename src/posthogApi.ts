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