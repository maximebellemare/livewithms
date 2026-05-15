import type { LongitudinalEntry } from "../../longitudinal/types";
import type { RecoveryCycle } from "../types";

export function deriveRecoveryCycles(entries: LongitudinalEntry[]): RecoveryCycle[] {
  if (entries.length < 8) {
    return [];
  }

  const recent = entries.slice(0, 16);
  const higherFatigue = recent.filter((entry) => (entry.fatigue ?? 0) >= 4).length;
  const lowSleep = recent.filter((entry) => (entry.sleep_hours ?? 99) < 6).length;

  if (higherFatigue >= 5 && lowSleep >= 4) {
    return [
      {
        pace: "slower",
        body: "Recovery appears to take a little more room after more demanding stretches.",
      },
    ];
  }

  if (higherFatigue >= 3) {
    return [
      {
        pace: "rebuilding",
        body: "There seems to be a rhythm of easing back in after heavier periods.",
      },
    ];
  }

  return [
    {
      pace: "steady",
      body: "Your longer view suggests a steadier recovery rhythm across recent stretches.",
    },
  ];
}

