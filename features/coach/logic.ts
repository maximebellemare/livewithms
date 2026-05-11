import type { DailyCheckIn } from "../checkins/types";

export type CoachActionKey = "reflect" | "reset" | "plan";

export type CoachFocus = {
  title: string;
  body: string;
};

export type CoachMessage = {
  title: string;
  body: string;
};

export type CoachPromptSet = {
  title: string;
  prompts: string[];
};

export function formatMetricValue(value: number | null, suffix = "") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

export function buildCoachSummary(entry: DailyCheckIn | null) {
  if (!entry) {
    return [];
  }

  return [
    { label: "Fatigue", value: formatMetricValue(entry.fatigue) },
    { label: "Mood", value: formatMetricValue(entry.mood) },
    { label: "Stress", value: formatMetricValue(entry.stress) },
    { label: "Sleep", value: formatMetricValue(entry.sleep_hours, "h") },
    { label: "Pain", value: formatMetricValue(entry.pain) },
    { label: "Brain fog", value: formatMetricValue(entry.brain_fog) },
  ];
}

export function buildCoachMessage(entry: DailyCheckIn | null): CoachMessage {
  if (!entry) {
    return {
      title: "A calm place to check in",
      body: "You can reflect, reset, or plan ahead here even before you log today’s check-in.",
    };
  }

  const fatigue = entry.fatigue ?? 0;
  const mood = entry.mood ?? 0;
  const stress = entry.stress ?? 0;
  const pain = entry.pain ?? 0;
  const brainFog = entry.brain_fog ?? 0;
  const sleepHours = entry.sleep_hours ?? null;

  if (fatigue >= 4 && sleepHours !== null && sleepHours < 6) {
    return {
      title: "Recovery matters today",
      body: "Your body may be asking for a lighter pace. Choose one priority and let rest support the rest.",
    };
  }

  if (stress >= 4 && fatigue >= 4) {
    return {
      title: "This may be a high-load day",
      body: "Keeping the day simple could help. Pick the next useful step and release the rest for now.",
    };
  }

  if (mood <= 2) {
    return {
      title: "Gentle support may help today",
      body: "Aim small. A tiny win, a reset, or one steadying routine can still count as real progress.",
    };
  }

  if (pain >= 4 || brainFog >= 4) {
    return {
      title: "Your signals look heavier today",
      body: "Reduce decision load where you can and lean on whatever makes the day feel steadier.",
    };
  }

  if ((sleepHours ?? 0) >= 7 && fatigue <= 2 && stress <= 2 && mood >= 4) {
    return {
      title: "There is something to learn from this day",
      body: "You seem to have more room today. Notice what helped so you can come back to it tomorrow.",
    };
  }

  return {
    title: "Stay close to what helps",
    body: "Today looks mixed. Keep expectations kind and pay attention to the small things that give you a bit more steadiness.",
  };
}

export function buildCoachFocus(entry: DailyCheckIn | null): CoachFocus {
  if (!entry) {
    return {
      title: "Start with the basics",
      body: "A quick check-in can make the rest of Coach feel more personal, but you can still reset or plan ahead right now.",
    };
  }

  const fatigue = entry.fatigue ?? 0;
  const stress = entry.stress ?? 0;
  const mood = entry.mood ?? 0;
  const sleepHours = entry.sleep_hours ?? 0;

  if (fatigue >= 4) {
    return {
      title: "Today’s focus: protect your energy",
      body: "Keep your list short and give yourself permission to pace the day around what matters most.",
    };
  }

  if (stress >= 4) {
    return {
      title: "Today’s focus: make space to reset",
      body: "A short pause could help your whole day feel a bit less loaded.",
    };
  }

  if (mood <= 2) {
    return {
      title: "Today’s focus: be kind to yourself",
      body: "Try looking for one gentle support instead of pushing for a perfect day.",
    };
  }

  if (sleepHours > 0 && sleepHours < 6) {
    return {
      title: "Today’s focus: lower the bar where you can",
      body: "Poor sleep can change the whole feel of a day. Let lighter expectations help you recover.",
    };
  }

  return {
    title: "Today’s focus: notice what is working",
    body: "When the day has more room, it’s worth paying attention to the habits or supports that helped create it.",
  };
}

export function buildSuggestedActions(entry: DailyCheckIn | null) {
  if (!entry) {
    return [
      "Try a 60-second reset",
      "Reflect on what would help tonight",
      "Make tomorrow feel 5% easier",
    ];
  }

  const actions: string[] = [];

  if ((entry.stress ?? 0) >= 4) {
    actions.push("Take a calm reset");
  }

  if ((entry.fatigue ?? 0) >= 4 || (entry.pain ?? 0) >= 4) {
    actions.push("Choose one clear priority");
  }

  if ((entry.mood ?? 0) <= 2) {
    actions.push("Look for one small win");
  }

  if ((entry.sleep_hours ?? 0) < 6) {
    actions.push("Plan a softer evening");
  }

  actions.push("Write one thing to carry into tomorrow");

  return Array.from(new Set(actions)).slice(0, 3);
}

export function buildReflectionPrompts(entry: DailyCheckIn | null): CoachPromptSet {
  if (!entry) {
    return {
      title: "A few gentle prompts",
      prompts: [
        "What felt hardest today?",
        "What helped even a little?",
        "What would make tomorrow 5% easier?",
      ],
    };
  }

  const fatigue = entry.fatigue ?? 0;
  const mood = entry.mood ?? 0;
  const stress = entry.stress ?? 0;
  const sleepHours = entry.sleep_hours ?? 0;

  if (fatigue >= 4 && sleepHours < 6) {
    return {
      title: "Tonight’s reflection",
      prompts: [
        "Where did your energy feel most stretched today?",
        "What could help you rest earlier tonight?",
        "What can you let go of before tomorrow starts?",
      ],
    };
  }

  if (stress >= 4) {
    return {
      title: "A steadier reset",
      prompts: [
        "What felt most loaded today?",
        "What helped your body settle, even briefly?",
        "What is one thing you can simplify tomorrow?",
      ],
    };
  }

  if (mood <= 2) {
    return {
      title: "A gentler check-in",
      prompts: [
        "What felt especially heavy today?",
        "Was there one moment that felt even a little better?",
        "What support would feel kindest tomorrow?",
      ],
    };
  }

  return {
    title: "A simple reflection",
    prompts: [
      "What helped even a little today?",
      "What do you want to remember from this day?",
      "What would make tomorrow 5% easier?",
    ],
  };
}
