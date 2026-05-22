import type { DailyCheckIn } from "../checkins/types";
import type { AdaptiveProfile } from "../adaptive/types";
import type {
  ComplexityTolerance,
  PromptStylePreference,
  ReflectionDepthPreference,
  ReflectionTone,
} from "../../lib/personalization/types";

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

export type CoachPreviewMessage = {
  role: "coach" | "user";
  content: string;
};

export type ReflectionTheme = {
  label: string;
  count: number;
};

export function formatMetricValue(value: number | null, suffix = "") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

export function formatScaleValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value}/5`;
}

export function buildCoachSummary(entry: DailyCheckIn | null) {
  if (!entry) {
    return [];
  }

  return [
    { label: "Fatigue", value: formatScaleValue(entry.fatigue) },
    { label: "Mood", value: formatScaleValue(entry.mood) },
    { label: "Stress", value: formatScaleValue(entry.stress) },
    { label: "Sleep", value: formatMetricValue(entry.sleep_hours, "h") },
    { label: "Pain", value: formatScaleValue(entry.pain) },
    { label: "Brain fog", value: formatScaleValue(entry.brain_fog) },
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
      body: "Aim small. A tiny win, a reset, or one steadying routine can still be enough for today.",
    };
  }

  if (pain >= 4 || brainFog >= 4) {
    return {
      title: "This may be a lower-clarity day",
      body: "When pain or brain fog feel heavier, fewer decisions and simpler expectations can help the day feel more manageable.",
    };
  }

  if ((sleepHours ?? 0) >= 7 && fatigue <= 2 && stress <= 2 && mood >= 4) {
    return {
      title: "There may be a little more room today",
      body: "If today feels a bit steadier, it may be worth noticing what helped.",
    };
  }

  return {
    title: "Keep the day steady",
    body: "Today looks mixed. Lighter expectations and one useful next step may be enough.",
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
    title: "Today’s focus: notice what is helping",
    body: "If the day has a little more room, it may help to notice what is making it easier.",
  };
}

export function buildSuggestedActions(entry: DailyCheckIn | null) {
  if (!entry) {
    return [
      "Try a short reset",
      "Write a few words about today",
      "Make tomorrow feel a little lighter",
    ];
  }

  const actions: string[] = [];

  if ((entry.stress ?? 0) >= 4) {
    actions.push("Slow things down");
  }

  if ((entry.fatigue ?? 0) >= 4 || (entry.pain ?? 0) >= 4) {
    actions.push("Protect your energy");
  }

  if ((entry.brain_fog ?? 0) >= 4) {
    actions.push("Keep decisions minimal");
  }

  if ((entry.mood ?? 0) <= 2) {
    actions.push("Try a short reflection");
  }

  if ((entry.sleep_hours ?? 0) < 6) {
    actions.push("Aim for a quieter evening");
  }

  actions.push("Carry one steady thing into tomorrow");

  return Array.from(new Set(actions)).slice(0, 3);
}

export function buildCoachConversationPreview(entry: DailyCheckIn | null): CoachPreviewMessage[] {
  const message = buildCoachMessage(entry);
  const focus = buildCoachFocus(entry);

  if (!entry) {
    return [
      {
        role: "coach",
        content: "You can start gently here, even before today’s check-in.",
      },
      {
        role: "coach",
        content: "You can reflect, reset, or make one small plan.",
      },
    ];
  }

  return [
    {
      role: "coach",
      content: message.body,
    },
    {
      role: "coach",
      content: `${focus.title.replace("Today’s focus: ", "")}. You can keep this simple.`,
    },
  ];
}

export function buildReflectionPrompts(
  entry: DailyCheckIn | null,
  adaptiveProfile?: AdaptiveProfile | null,
  preferences?: {
    reflectionDepthPreference?: ReflectionDepthPreference;
    promptStylePreference?: PromptStylePreference;
    reflectionTonePreference?: ReflectionTone;
    complexityTolerance?: ComplexityTolerance;
  } | null,
): CoachPromptSet {
  const prefersShort =
    preferences?.reflectionDepthPreference === "brief" || preferences?.complexityTolerance === "lower";
  const prefersOpenEnded = preferences?.promptStylePreference === "open-ended";
  const prefersStructured = preferences?.promptStylePreference === "structured";

  if (!entry) {
    if (adaptiveProfile?.engagementPattern === "gentle-reengagement") {
      return {
        title: "A gentle return",
        prompts: prefersShort
          ? ["What feels most present lately?", "What would feel easiest to return to?"]
          : [
              "What has felt most present lately?",
              "What support would feel easiest to return to?",
              "What would make tomorrow feel 5% more manageable?",
            ],
      };
    }

    return {
      title: "A few gentle prompts",
      prompts: prefersShort
        ? ["What felt hardest today?", "What helped even a little?"]
        : [
            "What felt hardest today?",
            "What helped even a little?",
            prefersOpenEnded ? "What feels worth noticing before tomorrow?" : "What would make tomorrow 5% easier?",
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
      prompts: prefersShort
        ? ["Where did your energy feel most stretched?", "What can you let go of tonight?"]
        : [
            "Where did your energy feel most stretched today?",
            "What could help you rest earlier tonight?",
            "What can you let go of before tomorrow starts?",
          ],
    };
  }

  if (stress >= 4) {
    return {
      title: "A steadier reset",
      prompts: prefersStructured
        ? [
            "What felt most loaded today?",
            "What helped your body settle, even briefly?",
            "What is one thing you can simplify tomorrow?",
          ]
        : [
            "What felt most loaded today?",
            "Where did things soften, even briefly?",
            prefersShort ? "What can stay simple next?" : "What is one thing you can simplify tomorrow?",
          ],
    };
  }

  if (adaptiveProfile?.fatigueTrend === "high") {
    return {
      title: "A lower-energy check-in",
      prompts: prefersShort
        ? ["Where has energy felt most limited lately?", "What do you need less of this week?"]
        : [
            "Where did your energy feel most limited lately?",
            "What has helped protect even a small amount of energy?",
            "What do you need less of this week?",
          ],
    };
  }

  if ((entry?.brain_fog ?? 0) >= 4 || adaptiveProfile?.brainFogTrend === "high") {
    return {
      title: "A simpler reflection",
      prompts: [
        "What is hardest to hold in your head right now?",
        "What feels easiest to let be simple today?",
        ...(prefersShort ? [] : ["What one thing matters most for the rest of the day?"]),
      ],
    };
  }

  if (mood <= 2) {
    return {
      title: "A gentler check-in",
      prompts: prefersShort
        ? ["What felt especially heavy today?", "What support would feel kindest next?"]
        : [
            "What felt especially heavy today?",
            "Was there one moment that felt even a little better?",
            "What support would feel kindest tomorrow?",
          ],
    };
  }

  return {
    title: "A simple reflection",
    prompts: prefersStructured
      ? [
          "What helped even a little today?",
          "What do you need more of lately?",
          ...(prefersShort ? [] : ["What do you want to remember from this day?"]),
          "What would make tomorrow 5% easier?",
        ]
      : [
          "What helped even a little today?",
          prefersOpenEnded ? "What feels worth carrying forward from this day?" : "What do you need more of lately?",
          ...(prefersShort ? [] : ["What do you want to remember from this day?"]),
          ...(preferences?.reflectionTonePreference === "emotionally-reflective"
            ? ["What feeling feels most worth naming before the day ends?"]
            : []),
        ],
  };
}

export function buildReflectionStarter(prompt: string) {
  if (prompt.endsWith("?")) {
    return `${prompt}\n`;
  }

  return `${prompt} `;
}

const THEME_KEYWORDS: Array<{ label: string; matches: string[] }> = [
  { label: "stress", matches: ["stress", "overwhelm", "overwhelmed", "loaded", "pressure", "tense"] },
  { label: "fatigue", matches: ["fatigue", "tired", "exhausted", "energy", "drained"] },
  { label: "sleep", matches: ["sleep", "rest", "rested", "awake", "insomnia"] },
  { label: "pain", matches: ["pain", "ache", "aching", "sore", "spasm", "spasticity"] },
  { label: "support", matches: ["helped", "support", "kind", "gentle", "steady"] },
  { label: "planning", matches: ["plan", "priority", "schedule", "organize", "organization"] },
];

export function getRecurringReflectionThemes(reflections: string[]): ReflectionTheme[] {
  const counts = new Map<string, number>();

  for (const reflection of reflections) {
    const text = reflection.toLowerCase();

    for (const theme of THEME_KEYWORDS) {
      if (theme.matches.some((match) => text.includes(match))) {
        counts.set(theme.label, (counts.get(theme.label) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }));
}
