export function getInsightsFallbackSummary() {
  return "More check-ins may help reveal clearer patterns over time.";
}

export function getInsightDetailFallback() {
  return "There is not enough information yet to identify a reliable pattern.";
}

export function getWeeklyTrendIndicator(
  difference: number | null,
  higherIsBetter: boolean,
) {
  if (difference === null || Math.abs(difference) < 0.35) {
    return "Fairly steady";
  }

  if (higherIsBetter) {
    return difference > 0 ? "A little steadier" : "A little lower";
  }

  return difference < 0 ? "A little lighter" : "A little heavier";
}

export function formatTrendPointLabel(date: string) {
  const day = date.slice(8);
  return day.startsWith("0") ? day.slice(1) : day;
}

export function formatPatternStrength(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (Math.abs(value) < 0.2) {
    return "Early signal";
  }

  if (Math.abs(value) < 0.45) {
    return "Some signal";
  }

  return "Clearer signal";
}
