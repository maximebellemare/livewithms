export function validateSupportLoadBalancing(input: {
  visibleSystems: string[];
  actionCount: number;
  lineCount: number;
  maxVisibleSystems: number;
  maxActions: number;
  maxLines: number;
}) {
  return {
    balanced:
      input.visibleSystems.length <= input.maxVisibleSystems &&
      input.actionCount <= input.maxActions &&
      input.lineCount <= input.maxLines,
  };
}
