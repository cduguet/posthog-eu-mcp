import { ApiResponseSchema } from "../../schema/api";
export const withPagination = async (url, apiToken, dataSchema) => {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${apiToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const data = await response.json();
    const responseSchema = ApiResponseSchema(dataSchema);
    const parsedData = responseSchema.parse(data);
    const results = parsedData.results.map((result) => result);
    if (parsedData.next) {
        const nextResults = await withPagination(parsedData.next, apiToken, dataSchema);
        return [...results, ...nextResults];
    }
    return results;
};
export const getProjectBaseUrl = (projectId) => {
    if (projectId === "@current") {
        return "https://us.posthog.com";
    }
    return `https://us.posthog.com/project/${projectId}`;
};
