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
      footer: "You can keep using the app normally.",
    };
  }

  if ((input.fatigue ?? 0) >= 4 || (input.brainFog ?? 0) >= 4) {
    return {
      title: "Checked in",
      body: "That can be enough for today.",
      insight: "Today seems like a lower-energy day. Keep things simple if you can.",
      footer: input.lowEnergyMode ? "You can stop here." : "You can leave it there for now.",
    };
  }

  if ((input.stress ?? 0) >= 4) {
    return {
      title: "Checked in",
      body: "Your check-in is here when you want to return to it.",
      insight: "Today may be asking a lot of you. A quieter pace may help, if it is available.",
      footer: "You can leave it there for now.",
    };
  }

  if (input.mood !== null && input.mood <= 1) {
    return {
      title: "Checked in",
      body: "Your check-in is here when you want to return to it.",
      insight: "Today may feel heavier than usual. Keeping the rest of the day gentle may be enough.",
      footer: "You can stop here if that feels right.",
    };
  }

  if (input.hasNotes) {
    return {
      title: "Checked in",
      body: "That is saved for later, too.",
      insight: "You left yourself a little more context to come back to when it helps.",
      footer: "You can leave it there for today.",
    };
  }

  return {
    title: "Checked in",
    body: "That can be enough for now.",
    insight: "Your check-in is here whenever you want a quiet snapshot of today.",
    footer: input.lowEnergyMode ? "You can stop here." : "You can leave it there for now.",
  };
}
