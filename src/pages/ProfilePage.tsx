import { useState } from "react";
import DigestPreviewCard from "@/components/DigestPreviewCard";
import PageHeader from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { ChevronRight, Download, Shield, ExternalLink, FileText, LogOut, Moon, Sun, Mail, Check, Mails, Sparkles, Users, BellRing } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import NotificationToggle from "@/components/NotificationToggle";
import { toast } from "sonner";
import { useEntriesInRange } from "@/hooks/useEntries";
import { useWeekStreak } from "@/hooks/useWeekStreak";
import { format, startOfWeek } from "date-fns";
import { AvatarUpload } from "@/components/community/AvatarUpload";

function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntil = (8 - day) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntil);
  const weekday = next.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${weekday} ${monthDay}`;
}

function getWeeklyMotivation(daysLogged: number, goal: number): string {
  if (daysLogged === 0) return "Log today to start your week strong 💪";
  if (daysLogged < goal * 0.5) return `${daysLogged} day${daysLogged > 1 ? "s" : ""} logged — keep going! ⚡`;
  if (daysLogged < goal) return `${daysLogged}/${goal} days — almost there! 🎉`;
  return `Goal reached — ${daysLogged}/${goal} days logged! 🔥`;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  // This week's entries (Monday → today)
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(new Date(), "yyyy-MM-dd");
  const { data: weekEntries } = useEntriesInRange(weekStart, weekEnd);
  const daysLoggedThisWeek = weekEntries?.length ?? 0;

  // Consecutive-week streak — shared hook
  const { weekStreak } = useWeekStreak();

  const [neuroEmail, setNeuroEmail] = useState<string>("");
  const [neuroName, setNeuroName] = useState<string>("");
  const [neuroEmailInit, setNeuroEmailInit] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [togglingDigest, setTogglingDigest] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInit, setDisplayNameInit] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [sendingTestDigest, setSendingTestDigest] = useState(false);

  // Initialise local state from loaded profile (once)
  if (profile && !neuroEmailInit) {
    setNeuroEmail(profile.neurologist_email ?? "");
    setNeuroName(profile.neurologist_name ?? "");
    setNeuroEmailInit(true);
  }

  if (profile && !displayNameInit) {
    setDisplayName((profile as any).display_name ?? "");
    setDisplayNameInit(true);
  }

  const handleSaveDisplayName = async () => {
    const trimmed = displayName.trim();
    if (trimmed.length > 30) { toast.error("Display name must be under 30 characters"); return; }
    setSavingDisplayName(true);
    try {
      await updateProfile.mutateAsync({ display_name: trimmed || null } as any);
      toast.success("Community display name saved!");
    } catch {
      toast.error("Failed to save display name");
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleToggleDigest = async () => {
    if (!profile) return;
    const next = !profile.weekly_digest_enabled;
    setTogglingDigest(true);
    try {
      await updateProfile.mutateAsync({ weekly_digest_enabled: next } as any);
      toast.success(next ? "Weekly digest enabled — you'll get it every Monday." : "Weekly digest disabled.");
    } catch {
      toast.error("Failed to update preference.");
    } finally {
      setTogglingDigest(false);
    }
  };

  const handleSaveNeuroEmail = async () => {
    const trimmed = neuroEmail.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSavingEmail(true);
    try {
      await updateProfile.mutateAsync({
        neurologist_email: trimmed || null,
        neurologist_name: neuroName.trim() || null,
      } as any);
      toast.success("Neurologist details saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSendTestDigest = async () => {
    if (!user?.email) return;
    setSendingTestDigest(true);
    try {
      const res = await fetch(
        `https://fpjfoadvytpvrhligdye.supabase.co/functions/v1/send-weekly-digest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test_email: user.email }),
        }
      );
      const json = await res.json();
      const result = json?.results?.[0];
      if (result?.status === "sent") {
        await updateProfile.mutateAsync({ last_digest_sent_at: new Date().toISOString() } as any);
        toast.success("Test digest sent! Check your inbox.");
      } else {
        toast.error(result?.error ?? "Failed to send test digest.");
      }
    } catch {
      toast.error("Failed to send test digest.");
    } finally {
      setSendingTestDigest(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Your MS companion settings" />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">
        {/* User info */}
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <AvatarUpload currentUrl={(profile as any)?.avatar_url ?? null} />
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {profile?.ms_type ? `${profile.ms_type} Profile` : "My MS Profile"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="mt-3 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>Edit MS Profile</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Community Display Name */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Community Display Name</p>
          </div>
          <p className="text-xs text-muted-foreground">This name is shown on your posts and comments in the Community forum.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveDisplayName()}
              placeholder="e.g. MSWarrior_22"
              maxLength={30}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleSaveDisplayName}
              disabled={savingDisplayName}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingDisplayName ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Neurologist details */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Neurologist Details</p>
          </div>
          <p className="text-xs text-muted-foreground">Used when sending PDF reports directly to your neurologist.</p>
          <div className="space-y-2 pt-1">
            <input
              type="text"
              value={neuroName}
              onChange={(e) => setNeuroName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNeuroEmail()}
              placeholder="Dr. Smith"
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <input
                type="email"
                value={neuroEmail}
                onChange={(e) => setNeuroEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveNeuroEmail()}
                placeholder="doctor@neurology.com"
                maxLength={255}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={handleSaveNeuroEmail}
                disabled={savingEmail}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {savingEmail ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Report */}
        <Link
          to="/reports"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent p-4 shadow-soft transition-all hover:shadow-card active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Doctor-Ready Report</p>
            <p className="text-xs text-muted-foreground">Generate PDF for your neurologist</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {/* Settings */}
        <div className="space-y-1">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Settings</p>

          {/* Dark mode */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
          >
            {isDark ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{isDark ? "Light Mode" : "Dark Mode"}</p>
              <p className="text-xs text-muted-foreground">{isDark ? "Switch to light theme" : "Switch to dark theme"}</p>
            </div>
            <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${isDark ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>

          <NotificationToggle />

          {/* Notification Preferences */}
          {profile && (
            <div className="mx-3 mb-1 space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-2 pt-1 pb-0.5">
                <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Notification Preferences</span>
              </div>
              {[
                { key: "notify_post_comments" as const, label: "Comments on my posts", desc: "Get notified when someone comments on your post" },
                { key: "notify_post_likes" as const, label: "Likes on my posts", desc: "Get notified when someone reacts to your post" },
                { key: "notify_thread_replies" as const, label: "Thread replies", desc: "Get notified when someone comments on a thread you joined" },
                { key: "notify_push_enabled" as const, label: "Browser push notifications", desc: "Receive push notifications even when the app is closed" },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => {
                    const current = (profile as any)[key] ?? true;
                    updateProfile.mutate({ [key]: !current } as any);
                    toast.success(!current ? `${label} enabled` : `${label} disabled`);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                  <div className={`relative h-4 w-7 rounded-full transition-colors flex-shrink-0 ${(profile as any)[key] !== false ? "bg-primary" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${(profile as any)[key] !== false ? "translate-x-3" : "translate-x-0.5"}`} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Weekly digest toggle */}
          <button
            onClick={handleToggleDigest}
            disabled={togglingDigest || !profile}
            className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground disabled:opacity-60"
          >
            <Mails className="h-4 w-4 flex-shrink-0 mt-0.5 self-start" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Weekly Email Digest</p>
              <p className="text-xs text-muted-foreground">Symptom summary every Monday morning</p>

              {profile?.weekly_digest_enabled && (
                <div className="mt-2 space-y-2">
                  {/* Goal picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-0.5">Goal:</span>
                    {[3, 5, 7].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProfile.mutate({ weekly_log_goal: g } as any);
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors border ${
                          (profile.weekly_log_goal ?? 7) === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {g}×/wk
                      </button>
                    ))}
                  </div>

                  {/* Progress bar + week streak badge */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min((daysLoggedThisWeek / (profile.weekly_log_goal ?? 7)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-foreground shrink-0">
                      {daysLoggedThisWeek}/{profile.weekly_log_goal ?? 7}
                    </span>
                    {weekStreak >= 2 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300 shrink-0">
                        {weekStreak} wk 🔥
                      </span>
                    )}
                    {weekStreak === 1 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                        1 wk ⚡
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {getWeeklyMotivation(daysLoggedThisWeek, profile.weekly_log_goal ?? 7)}
                    </p>
                    <p className="text-[11px] text-primary shrink-0">Next: {getNextMonday()}</p>
                  </div>

                  {/* Send test digest */}
                  <div className="mt-1 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendTestDigest();
                      }}
                      disabled={sendingTestDigest}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
                    >
                      {sendingTestDigest ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Mails className="h-3 w-3" />
                      )}
                      {sendingTestDigest ? "Sending…" : "Send test digest now"}
                    </button>
                    {profile?.last_digest_sent_at && (
                      <p className="text-[10px] text-muted-foreground pl-0.5">
                        Last sent:{" "}
                        {new Date(profile.last_digest_sent_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Digest preview card */}
                  <DigestPreviewCard
                    entries={weekEntries ?? []}
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    weeklyLogGoal={profile.weekly_log_goal ?? 7}
                    weekStreak={weekStreak}
                  />
                </div>
              )}
            </div>
            <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 mt-0.5 self-start ${profile?.weekly_digest_enabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${profile?.weekly_digest_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>

          {[
            { icon: Shield, label: "Privacy & Data", desc: "Manage your data preferences", to: "/privacy" },
            { icon: Download, label: "Export Data", desc: "Download your health data", to: "/privacy" },
            { icon: Sparkles, label: "Feature Roadmap", desc: "See what's coming next", to: "/roadmap" },
          ].map(({ icon: Icon, label, desc, to }) => (
            <Link key={label} to={to} className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </Link>
          ))}

          <button
            onClick={handleSignOut}
            className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
          </button>
        </div>

        {/* Crisis resources */}
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs font-medium text-foreground">Need support?</p>
          <a href="https://www.nationalmssociety.org" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            National MS Society <ExternalLink className="h-3 w-3" />
          </a>
          <p className="mt-2 text-[10px] text-muted-foreground">Crisis Line: 988 (Suicide & Crisis Lifeline)</p>
        </div>

        <p className="pb-4 text-center text-[10px] text-muted-foreground">
          LiveWithMS v1.0 · Not medical advice · © 2026
        </p>
      </div>
    </>
  );
};

export default ProfilePage;
