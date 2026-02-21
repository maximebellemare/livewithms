import { ArrowLeft, Bell, BellRing, Heart, MessageCircle, Bookmark, MessageSquare, Smartphone, Mails, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { useState } from "react";

// Hour options in user-friendly local time labels
function buildHourOptions() {
  const options: { label: string; utcHour: number }[] = [];
  for (let h = 6; h <= 23; h++) {
    const localDate = new Date();
    localDate.setHours(h, 0, 0, 0);
    const utcHour = localDate.getUTCHours();
    const display = h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
    options.push({ label: display, utcHour });
  }
  return options;
}

const HOUR_OPTIONS = buildHourOptions();

function utcHourToLabel(utcHour: number): string {
  const found = HOUR_OPTIONS.find((o) => o.utcHour === utcHour);
  if (found) return found.label;
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  const h = d.getHours();
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

interface ToggleRowProps {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleRow = ({ icon: Icon, iconColor = "text-primary", label, desc, enabled, onToggle }: ToggleRowProps) => (
  <button
    onClick={onToggle}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary"
  >
    <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <div className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}>
      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
    </div>
  </button>
);

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const {
    state, isSubscribed, subscribe, unsubscribe, supported,
    reminderHour, updateReminderHour,
  } = usePushNotifications();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const togglePref = (key: string, label: string) => {
    if (!profile) return;
    const current = (profile as any)[key] ?? true;
    updateProfile.mutate({ [key]: !current } as any);
    toast.success(!current ? `${label} enabled` : `${label} disabled`);
  };

  const handlePushToggle = async () => {
    if (state === "denied") {
      toast.error("Notifications are blocked. Please allow them in your browser settings.");
      return;
    }
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Daily reminders turned off.");
      setShowTimePicker(false);
    } else {
      await subscribe(reminderHour);
      if (Notification.permission === "granted") {
        toast.success(`Daily reminder set for ${utcHourToLabel(reminderHour)} 🧡`);
      }
    }
  };

  const handleHourChange = async (utcHour: number) => {
    await updateReminderHour(utcHour);
    toast.success(`Reminder time updated to ${utcHourToLabel(utcHour)} 🧡`);
  };

  return (
    <>
      <PageHeader title="Notifications" subtitle="Manage all your notification preferences" showBack />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">

        {/* Community notifications */}
        <div className="rounded-xl bg-card p-1 shadow-soft space-y-0.5">
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <Bell className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Community Notifications</p>
          </div>
          <p className="px-3 pb-2 text-xs text-muted-foreground">
            Choose which community activity triggers in-app notifications.
          </p>

          {profile && (
            <>
              <ToggleRow
                icon={MessageCircle}
                label="Comments on my posts"
                desc="When someone comments on your post"
                enabled={(profile as any).notify_post_comments !== false}
                onToggle={() => togglePref("notify_post_comments", "Comment notifications")}
              />
              <ToggleRow
                icon={Heart}
                iconColor="text-red-500"
                label="Reactions on my posts"
                desc="When someone reacts to your post"
                enabled={(profile as any).notify_post_likes !== false}
                onToggle={() => togglePref("notify_post_likes", "Reaction notifications")}
              />
              <ToggleRow
                icon={Bookmark}
                label="Saves on my posts"
                desc="When someone bookmarks your post"
                enabled={(profile as any).notify_post_bookmarks !== false}
                onToggle={() => togglePref("notify_post_bookmarks", "Bookmark notifications")}
              />
              <ToggleRow
                icon={MessageSquare}
                label="Thread replies"
                desc="When someone replies in a thread you joined"
                enabled={(profile as any).notify_thread_replies !== false}
                onToggle={() => togglePref("notify_thread_replies", "Thread reply notifications")}
              />
            </>
          )}
        </div>

        {/* Push notifications */}
        {supported && (
          <div className="rounded-xl bg-card p-1 shadow-soft space-y-0.5">
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
              <Smartphone className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Push Notifications</p>
            </div>
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              Browser push notifications for reminders and real-time alerts.
            </p>

            <ToggleRow
              icon={BellRing}
              label="Daily symptom reminders"
              desc={isSubscribed ? `Reminder at ${utcHourToLabel(reminderHour)} daily` : "Get a daily reminder to log symptoms"}
              enabled={isSubscribed}
              onToggle={handlePushToggle}
            />

            {isSubscribed && (
              <div className="px-3 pb-3 animate-fade-in">
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

            {profile && (
              <ToggleRow
                icon={Bell}
                label="Push for community activity"
                desc="Receive push notifications for comments and replies"
                enabled={(profile as any).notify_push_enabled !== false}
                onToggle={() => togglePref("notify_push_enabled", "Community push notifications")}
              />
            )}
          </div>
        )}

        {/* Email notifications */}
        <div className="rounded-xl bg-card p-1 shadow-soft space-y-0.5">
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <Mails className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Email Notifications</p>
          </div>
          <p className="px-3 pb-2 text-xs text-muted-foreground">
            Email-based summaries and digests.
          </p>

          {profile && (
            <ToggleRow
              icon={Mails}
              label="Weekly email digest"
              desc={profile.weekly_digest_enabled ? "Symptom summary every Monday morning" : "Get a weekly symptom summary by email"}
              enabled={profile.weekly_digest_enabled}
              onToggle={() => {
                const next = !profile.weekly_digest_enabled;
                updateProfile.mutate({ weekly_digest_enabled: next } as any);
                toast.success(next ? "Weekly digest enabled — you'll get it every Monday." : "Weekly digest disabled.");
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationSettingsPage;
