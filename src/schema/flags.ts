export interface PostHogFeatureFlag {
  id: number;
  key: string;
  name: string;
}

export interface PostHogFlagsResponse {
  results?: PostHogFeatureFlag[];
}
