import type { DailyCheckIn } from "../checkins/types";
import type { JourneySnapshot } from "../../lib/journey-design/types";
import { deriveContinuitySummary, guardContinuityCalmness } from "../../lib/continuity-intelligence";

export type PremiumContinuityWindow = "monthly" | "seasonal" | "yearly";

export type PremiumContinuityMoment = {
  title: string;
  body: string;
};

export type PremiumContinuitySummary = {
  window: PremiumContinuityWindow;
  title: string;
  atAGlance: string;
  patternsWorthNoticing: string[];
  thingsThatBroughtCalm: string[];
  whatMayHelpNext: string[];
  continuityReflection: string;
  lifeBeyondSymptoms: string[];
  meaningfulMoments: PremiumContinuityMoment[];
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

export type PremiumContinuitySnapshots = {
  monthly: PremiumContinuitySummary;
  seasonal: PremiumContinuitySummary;
  yearly: PremiumContinuitySummary;
};

export type PremiumContinuityExportSection = {
  title: string;
  lines: string[];
};

export type PremiumContinuityExportContent = {
  title: string;
  subtitle: string;
  fileName: string;
  sections: PremiumContinuityExportSection[];
  text: string;
};

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => guardContinuityCalmness(line))
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

export function derivePremiumContinuitySnapshots(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  options?: { lowEnergyMode?: boolean },
): PremiumContinuitySnapshots {
  const summary = deriveContinuitySummary({
    entries,
    snapshot,
    lowEnergyMode: Boolean(options?.lowEnergyMode),
  });

  return {
    monthly: summary.snapshots.monthly,
    seasonal: summary.snapshots.seasonal,
    yearly: summary.snapshots.yearly,
  };
}

function sectionLines(summary: PremiumContinuitySummary) {
  const lines = [summary.atAGlance, summary.continuityReflection];
  lines.push(...summary.patternsWorthNoticing);
  lines.push(...summary.thingsThatBroughtCalm);
  lines.push(...summary.whatMayHelpNext);
  lines.push(...summary.lifeBeyondSymptoms);
  for (const moment of summary.meaningfulMoments) {
    lines.push(`${moment.title}: ${moment.body}`);
  }
  return clampLines(lines, 12);
}

export function buildPremiumContinuityExportContent(
  snapshots: PremiumContinuitySnapshots,
): PremiumContinuityExportContent {
  const sections: PremiumContinuityExportSection[] = [
    {
      title: "Monthly life snapshot",
      lines: sectionLines(snapshots.monthly),
    },
    {
      title: "Seasonal reflection",
      lines: sectionLines(snapshots.seasonal),
    },
  ];

  if (snapshots.yearly.hasEnoughData) {
    sections.push({
      title: "Yearly continuity summary",
      lines: sectionLines(snapshots.yearly),
    });
  }

  const text = sections
    .map((section) => [section.title, ...section.lines.map((line) => `• ${line}`)].join("\n"))
    .join("\n\n");

  return {
    title: "LiveWithMS continuity summary",
    subtitle:
      "A calmer longer-view reflection built from recent check-ins, steadier moments, and ordinary continuity.",
    fileName: `livewithms-continuity-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
    sections,
    text,
  };
}

export function canAccessPremiumContinuity(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
