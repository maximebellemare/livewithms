import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { ChevronRight, Download, Shield, ExternalLink, FileText, LogOut, Moon, Sun, Mail, Check, Mails } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import NotificationToggle from "@/components/NotificationToggle";
import { toast } from "sonner";
import { useEntriesInRange } from "@/hooks/useEntries";
import { format, startOfWeek } from "date-fns";

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

  const [neuroEmail, setNeuroEmail] = useState<string>("");
  const [neuroEmailInit, setNeuroEmailInit] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [togglingDigest, setTogglingDigest] = useState(false);

  // Initialise local state from loaded profile (once)
  if (profile && !neuroEmailInit) {
    setNeuroEmail(profile.neurologist_email ?? "");
    setNeuroEmailInit(true);
  }

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
      await updateProfile.mutateAsync({ neurologist_email: trimmed || null });
      toast.success("Neurologist email saved.");
    } catch {
      toast.error("Failed to save email.");
    } finally {
      setSavingEmail(false);
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl">
              🧡
            </div>
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

        {/* Neurologist email */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Neurologist Email</p>
          </div>
          <p className="text-xs text-muted-foreground">Pre-fills the recipient when you share a PDF report.</p>
          <div className="flex gap-2 pt-1">
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

                  {/* Progress bar */}
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
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {getWeeklyMotivation(daysLoggedThisWeek, profile.weekly_log_goal ?? 7)}
                    </p>
                    <p className="text-[11px] text-primary shrink-0">Next: {getNextMonday()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 mt-0.5 self-start ${profile?.weekly_digest_enabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${profile?.weekly_digest_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>

          {[
            { icon: Shield, label: "Privacy & Consent", desc: "Manage your data preferences" },
            { icon: Download, label: "Export Data", desc: "Download your health data" },
          ].map(({ icon: Icon, label, desc }) => (
            <button key={label} className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
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
