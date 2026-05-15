export function preventPopularityDynamics(input: {
  showCounts?: boolean;
  showReactions?: boolean;
  showReplies?: boolean;
}) {
  return {
    showCounts: false,
    showReactions: false,
    showReplies: false,
    safe: !input.showCounts && !input.showReactions && !input.showReplies,
  };
}

