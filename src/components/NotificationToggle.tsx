import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const NotificationToggle = () => {
  const { state, isSubscribed, subscribe, unsubscribe, supported } = usePushNotifications();

  if (!supported) return null;

  const handleToggle = async () => {
    if (state === "denied") {
      toast.error("Notifications are blocked. Please allow them in your browser settings, then try again.");
      return;
    }
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Daily reminders turned off.");
    } else {
      await subscribe();
      if (Notification.permission === "granted") {
        toast.success("You'll get a reminder at 8 PM to log your symptoms 🧡");
      }
    }
  };

  const Icon =
    state === "loading"  ? Loader2 :
    state === "denied"   ? BellOff :
    isSubscribed         ? BellRing : Bell;

  const label =
    state === "loading"  ? "Loading…" :
    state === "denied"   ? "Notifications blocked" :
    state === "unsupported" ? "Not supported on this device" :
    isSubscribed         ? "Daily reminders: ON" : "Daily reminders: OFF";

  const desc =
    state === "denied"   ? "Enable in browser settings to turn on reminders" :
    isSubscribed         ? "You'll be reminded at 8 PM to log your symptoms" :
    "Get a daily evening reminder to log your symptoms";

  return (
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
  );
};

export default NotificationToggle;
