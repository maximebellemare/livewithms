import type { AdaptiveFlow } from "../types";

export function generateReturnMessaging(returnExperience: AdaptiveFlow["returnExperience"]) {
  switch (returnExperience.style) {
    case "simple":
      return {
        title: "Good to see you today.",
        body: "We can keep things simple. You can start wherever feels manageable.",
      };
    case "reflective":
      return {
        title: "There is room to begin here.",
        body: "You can take this one small step at a time and notice only what feels useful.",
      };
    case "steady":
    default:
      return {
        title: "You can begin with the basics.",
        body: "A short check-in is enough to help today feel a little more grounded.",
      };
  }
}
