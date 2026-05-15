import { AI_TRUST_CERTAINTY_PATTERNS } from "../constants";

export function softenCertainty(text: string) {
  let next = text;

  for (const pattern of AI_TRUST_CERTAINTY_PATTERNS) {
    next = next.replace(pattern, "");
  }

  next = next.replace(/\bThis is\b/g, "This may be");
  next = next.replace(/\bThis suggests\b/g, "This may suggest");
  next = next.replace(/\bIt shows\b/g, "It may show");
  next = next.replace(/\bYou seem to be\b/g, "You may be");

  return next.replace(/\s{2,}/g, " ").trim();
}
