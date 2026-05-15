export type ReminderIntent = "daily-checkin" | "gentle-nudge" | "consistency-support";

export type ReminderPlan = {
  key: ReminderIntent;
  title: string;
  body: string;
  recommendedHour: number;
  recommendedMinute: number;
};

export const REMINDER_PLANS: ReminderPlan[] = [
  {
    key: "daily-checkin",
    title: "How are you feeling today?",
    body: "A short check-in can help you notice patterns when it feels useful.",
    recommendedHour: 19,
    recommendedMinute: 0,
  },
  {
    key: "gentle-nudge",
    title: "Small daily steps matter.",
    body: "You can come back whenever a short check-in feels supportive.",
    recommendedHour: 18,
    recommendedMinute: 30,
  },
  {
    key: "consistency-support",
    title: "How are you doing today?",
    body: "Patterns often become clearer with gentle consistency over time.",
    recommendedHour: 20,
    recommendedMinute: 0,
  },
];
