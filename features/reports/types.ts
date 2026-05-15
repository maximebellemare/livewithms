export type ReportRange = 7 | 30 | 90;

export type ReportAudience = "wellness" | "clinical";

export type ReportSectionKey =
  | "overview"
  | "symptom-trends"
  | "check-in-consistency"
  | "care-snapshot"
  | "coach-reflections"
  | "appointment-prep";

export type ReportDefinition = {
  key: "health-summary" | "care-summary" | "wellness-checkpoint";
  title: string;
  audience: ReportAudience;
  supportedRanges: ReportRange[];
  sections: ReportSectionKey[];
};

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: "health-summary",
    title: "Health Summary",
    audience: "wellness",
    supportedRanges: [7, 30],
    sections: ["overview", "symptom-trends", "check-in-consistency", "care-snapshot"],
  },
  {
    key: "wellness-checkpoint",
    title: "Wellness Checkpoint",
    audience: "wellness",
    supportedRanges: [30, 90],
    sections: ["overview", "symptom-trends", "check-in-consistency", "coach-reflections"],
  },
  {
    key: "care-summary",
    title: "Care Preparation Summary",
    audience: "clinical",
    supportedRanges: [7, 30],
    sections: ["overview", "symptom-trends", "care-snapshot", "appointment-prep"],
  },
];
