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
    body: "A short daily check-in reminder.",
    recommendedHour: 19,
    recommendedMinute: 0,
  },
  {
    key: "gentle-nudge",
    title: "Keep the check-in brief",
    body: "A shorter reminder for lower-energy days.",
    recommendedHour: 18,
    recommendedMinute: 30,
  },
  {
    key: "consistency-support",
    title: "Build check-in history",
    body: "More check-ins can make patterns easier to spot.",
    recommendedHour: 20,
    recommendedMinute: 0,
  },
];
