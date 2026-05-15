export function deriveBackoffWindow(attempt: number) {
  const normalizedAttempt = Math.max(0, attempt);
  const base = 1200;
  const max = 20_000;
  return Math.min(max, base * 2 ** normalizedAttempt);
}
