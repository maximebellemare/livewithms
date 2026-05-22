import type { RecoveryExperience } from "../types";

export function generateGentleReentry(experience: RecoveryExperience) {
  switch (experience.style) {
    case "extra-gentle":
      return {
        title: "Good to see you today.",
        body: "We can keep things very simple. A brief check-in or one small support tool can be enough.",
      };
    case "open":
      return {
        title: "Start where it feels manageable.",
        body: "No catch-up is needed. One small return is still useful.",
      };
    case "steady":
    default:
      return {
        title: "You can begin with the basics.",
        body: "A short check-in may be enough to help today feel a little clearer.",
      };
  }
}
