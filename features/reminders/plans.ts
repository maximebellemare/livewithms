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
    body: "A quick check-in can help patterns become more useful over time.",
    recommendedHour: 19,
    recommendedMinute: 0,
  },
  {
    key: "gentle-nudge",
    title: "Keep the check-in brief",
    body: "A few notes are enough when energy is low.",
    recommendedHour: 18,
    recommendedMinute: 30,
  },
  {
    key: "consistency-support",
    title: "Build check-in history",
    body: "Tracking today can make patterns easier to spot later.",
    recommendedHour: 20,
    recommendedMinute: 0,
  },
];
