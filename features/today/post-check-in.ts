type PostCheckInMomentInput = {
  fatigue: number | null;
  stress: number | null;
  brainFog: number | null;
  mood: number | null;
  hasNotes: boolean;
  queuedOffline: boolean;
  lowEnergyMode: boolean;
};

export type PostCheckInMoment = {
  title: string;
  body: string;
  insight: string;
  footer: string;
};

export function derivePostCheckInMoment(input: PostCheckInMomentInput): PostCheckInMoment {
  if (input.queuedOffline) {
    return {
      title: "Saved for now",
      body: "Your check-in is staying with you here for now.",
      insight: "It can sync quietly when the connection comes back.",
      footer: "The rest of the app is ready when needed.",
    };
  }

  if ((input.fatigue ?? 0) >= 4 || (input.brainFog ?? 0) >= 4) {
    return {
      title: "Checked in",
      body: "That can be enough for today.",
      insight: "Today seems like a lower-energy day. Keep things simple if you can.",
      footer: input.lowEnergyMode ? "Keep the rest of today simple." : "That is enough for now.",
    };
  }

  if ((input.stress ?? 0) >= 4) {
    return {
      title: "Checked in",
      body: "Your check-in is saved.",
      insight: "Today may be asking a lot of you. A quieter pace may help, if it is available.",
      footer: "Keep the next part of the day lighter if possible.",
    };
  }

  if (input.mood !== null && input.mood <= 1) {
    return {
      title: "Checked in",
      body: "Your check-in is saved.",
      insight: "Today may feel heavier than usual. Keeping the rest of the day gentle may be enough.",
      footer: "Keep the rest of the day gentle.",
    };
  }

  if (input.hasNotes) {
    return {
      title: "Checked in",
      body: "That is saved for later, too.",
      insight: "A little more context is there for later.",
      footer: "That is enough for today.",
    };
  }

  return {
    title: "Checked in",
    body: "That can be enough for now.",
    insight: "A quiet snapshot of today is in place.",
    footer: input.lowEnergyMode ? "Keep the rest of today simple." : "That is enough for now.",
  };
}
