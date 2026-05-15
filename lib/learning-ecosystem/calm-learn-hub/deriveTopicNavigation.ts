export function deriveTopicNavigation(input: {
  topics: string[];
  educationalLoad: "low" | "moderate" | "high";
}) {
  return {
    visibleTopics: input.topics.slice(0, input.educationalLoad === "high" ? 3 : input.educationalLoad === "moderate" ? 4 : 5),
    allowDeepExpansion: input.educationalLoad === "low",
  };
}
