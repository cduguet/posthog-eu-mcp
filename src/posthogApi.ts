import { ApiPropertyDefinitionSchema } from "./types/posthog";
import { withPagination } from "./lib/utils/api";
import { PropertyDefinitionSchema } from "./types/posthog";

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


export async function getPropertyDefinitions({ apiToken }: { apiToken: string }) {
	const propertyDefinitions = await withPagination(`https://us.posthog.com/api/projects/99423/property_definitions/`, apiToken, ApiPropertyDefinitionSchema);

	const propertyDefinitionsWithoutHidden = propertyDefinitions.filter((def) => !def.hidden);

	return propertyDefinitionsWithoutHidden.map((def) => PropertyDefinitionSchema.parse(def));
}