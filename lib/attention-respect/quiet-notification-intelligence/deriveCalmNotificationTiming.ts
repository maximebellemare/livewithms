export function deriveCalmNotificationTiming(input: {
  hour: number;
  minute: number;
  pressure: "low" | "moderate" | "high";
}) {
  const quietStartHour = 9;
  const quietEndHour = 20;

  let hour = Math.min(Math.max(input.hour, quietStartHour), quietEndHour);
  const minute = input.minute;

  if (input.pressure === "high" && hour < 19) {
    hour = 19;
  }

  if (input.pressure === "moderate" && hour < 13) {
    hour = 13;
  }

  return { hour, minute };
}
