import type { DailyCheckIn } from "../../../features/checkins/types";
import type { JourneySnapshot } from "../../journey-design/types";
import { guardContinuityCalmness } from "../governance/guardContinuityCalmness";

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => guardContinuityCalmness(line))
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

export function deriveOrdinaryLifeAnchors(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  lowEnergyMode: boolean,
) {
  const lines: string[] = [];
  const winsCount = entries.reduce((sum, entry) => sum + (entry.wins?.length ?? 0), 0);
  const triggers = entries.flatMap((entry) => entry.triggers ?? []);
  const uniqueTriggers = Array.from(new Set(triggers));

  if (winsCount > 0) {
    lines.push("Ordinary wins still showed up in small ways on some days.");
  }

  if (uniqueTriggers.includes("social day")) {
    lines.push("Social days were part of the picture too, not only symptom-heavy ones.");
  }

  if (uniqueTriggers.includes("rest day")) {
    lines.push("Rest days appeared as part of the rhythm, which can matter just as much as busier ones.");
  }

  if (uniqueTriggers.includes("travel")) {
    lines.push("Life context shifted at times, including days shaped by travel or being away from routine.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "grounding")) {
    lines.push("Grounding routines kept returning in small ways across changing days.");
  }

  if (snapshot?.continuitySignals.some((signal) => signal.kind === "return")) {
    lines.push("Returning after harder stretches has still been part of the longer picture.");
  }

  if (!lines.length) {
    lines.push("Life has still had ordinary texture around the symptoms, even when the harder days stand out more.");
  }

  return clampLines(lines, lowEnergyMode ? 1 : 3);
}
