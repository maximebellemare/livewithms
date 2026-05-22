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
    title: "How is today feeling?",
    body: "A short check-in can stay here for whenever it feels useful.",
    recommendedHour: 19,
    recommendedMinute: 0,
  },
  {
    key: "gentle-nudge",
    title: "You can keep this light",
    body: "If today allows for it, even a brief check-in can be enough.",
    recommendedHour: 18,
    recommendedMinute: 30,
  },
  {
    key: "consistency-support",
    title: "A little context can help later",
    body: "A small check-in can make patterns easier to notice over time.",
    recommendedHour: 20,
    recommendedMinute: 0,
  },
];
