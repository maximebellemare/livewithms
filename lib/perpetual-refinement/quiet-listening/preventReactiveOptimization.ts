export function preventReactiveOptimization(text: string) {
  return text
    .replace(/\boptimize every interaction\b/gi, "improve carefully over time")
    .replace(/\biterate aggressively\b/gi, "iterate thoughtfully")
    .replace(/\btest relentlessly\b/gi, "observe carefully");
}
