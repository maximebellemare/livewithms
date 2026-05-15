import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import type { QuietWinSignal, ReflectionSurfaceCard } from "../types";

export function generateQuietWinObservation(signal: QuietWinSignal): ReflectionSurfaceCard | null {
  const definitions: Record<QuietWinSignal, Omit<ReflectionSurfaceCard, "id" | "body"> & { body: string }> = {
    "returning-after-absence": {
      kind: "quiet-win",
      title: "A gentle return still matters",
      body: "You have continued returning, even after harder stretches away.",
      source: "quiet-win",
      relatedMetrics: [],
      tone: "light",
      confidence: "light",
      recencyDays: 0,
      emotionalUsefulness: 1,
      timingScore: 1,
      repetitionKey: "quiet-win-returning",
    },
    "emotional-honesty": {
      kind: "emotional-awareness",
      title: "You have been honest with yourself",
      body: "Some recent reflections carried clear honesty about what has felt hard.",
      source: "quiet-win",
      relatedMetrics: [],
      tone: "steady",
      confidence: "light",
      recencyDays: 1,
      emotionalUsefulness: 1,
      timingScore: 1,
      repetitionKey: "quiet-win-honesty",
    },
    "gentle-pacing": {
      kind: "pacing-reinforcement",
      title: "Gentler pacing is showing up",
      body: "Recent reflections suggest you have been making room for a softer pace.",
      source: "quiet-win",
      relatedMetrics: ["fatigue", "stress"],
      tone: "light",
      confidence: "light",
      recencyDays: 1,
      emotionalUsefulness: 1,
      timingScore: 1,
      repetitionKey: "quiet-win-pacing",
    },
    "improved-consistency": {
      kind: "calming-continuity",
      title: "A steadier rhythm is forming",
      body: "You have been returning a little more often lately, which can make patterns easier to notice.",
      source: "quiet-win",
      relatedMetrics: [],
      tone: "light",
      confidence: "light",
      recencyDays: 1,
      emotionalUsefulness: 1,
      timingScore: 1,
      repetitionKey: "quiet-win-consistency",
    },
    "reduced-self-criticism": {
      kind: "resilience-reflection",
      title: "Recent reflections seem softer",
      body: "Your recent reflections seem gentler toward yourself than before.",
      source: "quiet-win",
      relatedMetrics: [],
      tone: "steady",
      confidence: "light",
      recencyDays: 1,
      emotionalUsefulness: 1,
      timingScore: 1,
      repetitionKey: "quiet-win-self-kindness",
    },
    "calmer-reflections": {
      kind: "calming-continuity",
      title: "A calmer note is appearing",
      body: "There seems to be a calmer tone in some recent reflections.",
      source: "quiet-win",
      relatedMetrics: ["stress", "mood"],
      tone: "light",
      confidence: "light",
      recencyDays: 1,
      emotionalUsefulness: 1,
      timingScore: 1,
      repetitionKey: "quiet-win-calmer-tone",
    },
  };

  const definition = definitions[signal];
  const safety = validateObservationSafety(definition.body);
  if (!safety.safe) {
    return null;
  }

  return {
    ...definition,
    id: definition.repetitionKey,
    body: safety.sanitizedText,
  };
}
