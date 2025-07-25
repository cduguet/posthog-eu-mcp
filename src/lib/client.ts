import { PostHog } from 'posthog-node'

let _client: PostHog | undefined;

export const getPostHogClient = () => {
    if (!_client) {
        if (!process.env.POSTHOG_API_KEY) {
            throw new Error('POSTHOG_API_KEY is not set');
        }
        _client = new PostHog(process.env.POSTHOG_API_KEY, { host: 'https://us.i.posthog.com', flushAt: 1, flushInterval: 0 });
    }

    return _client;
}