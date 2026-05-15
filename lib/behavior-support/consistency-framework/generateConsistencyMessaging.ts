import type { ContinuityState, SustainableCadence } from "../types";

export function generateConsistencyMessaging(
  continuity: ContinuityState,
  cadence: SustainableCadence,
) {
  switch (continuity.level) {
    case "starting":
      return {
        title: "Start gently",
        body: "One check-in at a time is enough. This can stay light while you learn what feels useful.",
        summary: "A gentle beginning is still a real beginning.",
      };
    case "re-entering":
      return {
        title: "It is safe to return",
        body: "Small returns still matter. You can begin again from wherever you are.",
        summary: "Coming back quietly still counts as continuity.",
      };
    case "steady":
      return {
        title: cadence === "steady" ? "A steady rhythm is taking shape" : "You have been finding your rhythm",
        body: "You’ve continued finding moments to check in. The goal is steadiness that still feels livable.",
        summary: `You’ve checked in ${continuity.recentCheckInDays} ${
          continuity.recentCheckInDays === 1 ? "day" : "days"
        } this week.`,
      };
    case "settling":
      return {
        title: "A gentle rhythm is still building",
        body: "A few returns can be enough to make patterns easier to notice over time.",
        summary: `You’ve checked in ${continuity.recentCheckInDays} ${
          continuity.recentCheckInDays === 1 ? "day" : "days"
        } this week.`,
      };
    case "light":
    default:
      return {
        title: "Small returns still matter",
        body: "Even lighter stretches can still be useful. The app can meet you in smaller moments too.",
        summary: continuity.recentCheckInDays > 0
          ? `You’ve checked in ${continuity.recentCheckInDays} ${
              continuity.recentCheckInDays === 1 ? "day" : "days"
            } this week.`
          : "A brief return can still be enough today.",
      };
  }
}
