import type { LongitudinalMetricKey, LongitudinalEntry, TrendSummary, TrendWindow } from "../types";
import { buildUncertaintySafetySnapshot, moderateUncertaintyLanguage } from "../../uncertainty-safety/buildUncertaintySafetySnapshot";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getMetricValues(entries: LongitudinalEntry[], metric: LongitudinalMetricKey) {
  return entries.map((entry) => entry[metric] ?? null);
}

function getDirection(metric: LongitudinalMetricKey, firstHalf: number | null, secondHalf: number | null): TrendSummary["direction"] {
  if (firstHalf === null || secondHalf === null) {
    return "unknown";
  }

  const delta = secondHalf - firstHalf;
  if (Math.abs(delta) < 0.35) {
    return "flat";
  }

  if (metric === "mood" || metric === "sleep_hours" || metric === "water_glasses") {
    return delta > 0 ? "up" : "down";
  }

  return delta > 0 ? "up" : "down";
}

export function generateTrendSummary(window: TrendWindow, metric: LongitudinalMetricKey): TrendSummary {
  const values = getMetricValues(window.entries, metric);
  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = average(values.slice(0, midpoint));
  const secondHalf = average(values.slice(midpoint));
  const direction = getDirection(metric, firstHalf, secondHalf);
  const averageValue = average(values);

  const metricLabel = metric.replace(/_/g, " ");
  const summary =
    averageValue === null
      ? `There is not enough recent ${metricLabel} data yet to describe a longer pattern.`
      : direction === "flat"
        ? `${metricLabel.charAt(0).toUpperCase()}${metricLabel.slice(1)} has looked fairly steady in this window.`
        : direction === "up"
          ? `There seems to be a gentle upward shift in ${metricLabel} across this window.`
          : `There seems to be a gentle downward shift in ${metricLabel} across this window.`;
  const uncertaintySnapshot = buildUncertaintySafetySnapshot(window.entries, "STABLE");

  return {
    metric,
    direction,
    average: averageValue,
    summary: moderateUncertaintyLanguage(summary, uncertaintySnapshot),
  };
}
