import { Bell, BellOff, BellRing, Loader2, Clock } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { useState } from "react";

// Hour options in user-friendly local time labels
// We store UTC hours in DB; offset from browser to build the list
function buildHourOptions() {
  const options: { label: string; utcHour: number }[] = [];
  for (let h = 6; h <= 23; h++) {
    // h is local hour — convert to UTC
    const localDate = new Date();
    localDate.setHours(h, 0, 0, 0);
    const utcHour = localDate.getUTCHours();
    const ampm    = h < 12 ? "AM" : "PM";
    const display = h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
    options.push({ label: display, utcHour });
  }
  return options;
}

const HOUR_OPTIONS = buildHourOptions();

// Given a UTC hour from DB, find the closest local display label
function utcHourToLabel(utcHour: number): string {
  const found = HOUR_OPTIONS.find((o) => o.utcHour === utcHour);
  if (found) return found.label;
  // Fallback: reconstruct from UTC
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  const h = d.getHours();
  if (h === 0)  return "12:00 AM";
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

const NotificationToggle = () => {
  const {
    state, isSubscribed, subscribe, unsubscribe, supported,
    reminderHour, updateReminderHour,
  } = usePushNotifications();

  const [showTimePicker, setShowTimePicker] = useState(false);

  if (!supported) return null;

  const handleToggle = async () => {
    if (state === "denied") {
      toast.error("Notifications are blocked. Please allow them in your browser settings, then try again.");
      return;
    }
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Daily reminders turned off.");
      setShowTimePicker(false);
    } else {
      await subscribe(reminderHour);
      if (Notification.permission === "granted") {
        toast.success(`You'll get a daily reminder at ${utcHourToLabel(reminderHour)} 🧡`);
        setShowTimePicker(true);
      }
    }
  };

  const handleHourChange = async (utcHour: number) => {
    await updateReminderHour(utcHour);
    toast.success(`Reminder time updated to ${utcHourToLabel(utcHour)} 🧡`);
  };

  const Icon =
    state === "loading"  ? Loader2 :
    state === "denied"   ? BellOff :
    isSubscribed         ? BellRing : Bell;

  const label =
    state === "loading"     ? "Loading…" :
    state === "denied"      ? "Notifications blocked" :
    state === "unsupported" ? "Not supported on this device" :
    isSubscribed            ? "Daily reminders: ON" : "Daily reminders: OFF";

  const desc =
    state === "denied"   ? "Enable in browser settings to turn on reminders" :
    isSubscribed         ? `Reminder set for ${utcHourToLabel(reminderHour)} daily` :
    "Get a daily reminder to log your symptoms";

  return (
    <div className="w-full">
      {/* Main toggle row */}
      <button
        onClick={handleToggle}
        disabled={state === "loading" || state === "unsupported"}
        className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground disabled:opacity-50"
      >
        <Icon
          className={`h-4 w-4 flex-shrink-0 ${
            isSubscribed ? "text-primary" : "text-muted-foreground"
          } ${state === "loading" ? "animate-spin" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        {/* Toggle pill */}
        {state !== "loading" && state !== "denied" && state !== "unsupported" && (
          <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${isSubscribed ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isSubscribed ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
        )}
      </button>

      {/* Time picker — shown when subscribed */}
      {isSubscribed && (
        <div className="mx-3 mb-2 animate-fade-in">
          <button
            onClick={() => setShowTimePicker((p) => !p)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Clock className="h-3 w-3" />
            <span>Change reminder time · currently {utcHourToLabel(reminderHour)}</span>
          </button>

          {showTimePicker && (
            <div className="mt-2 grid grid-cols-4 gap-1.5 animate-fade-in">
              {HOUR_OPTIONS.map(({ label: timeLabel, utcHour }) => (
                <button
                  key={utcHour}
                  onClick={() => handleHourChange(utcHour)}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    utcHour === reminderHour
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {timeLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationToggle;
