import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { X, CalendarDays } from "lucide-react";
import { useEntriesInRange } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";

/* ── helpers ─────────────────────────────────────────────── */
function avg(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Severity scale: lower = better (fatigue, pain, etc.)
function scoreColor(v: number): string {
  if (v <= 3) return "text-emerald-600 dark:text-emerald-400";
  if (v <= 6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function scoreBg(v: number): string {
  if (v <= 3) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (v <= 6) return "bg-amber-100 dark:bg-amber-900/40";
  return "bg-red-100 dark:bg-red-900/40";
}

// Sleep scale: higher = better
function sleepColor(hrs: number): string {
  if (hrs >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (hrs >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function sleepBg(hrs: number): string {
  if (hrs >= 7) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (hrs >= 5) return "bg-amber-100 dark:bg-amber-900/40";
  return "bg-red-100 dark:bg-red-900/40";
}

function motivation(logged: number, goal: number): string {
  if (logged === 0) return "A fresh start awaits — this week, let's log every day! 💫";
  const pct = logged / goal;
  if (pct >= 1) return `You crushed your ${goal}-day goal — incredible consistency! 🔥`;
  if (pct >= 0.7) return `${logged}/${goal} days — so close! Let's go all the way this week! ⚡`;
  if (pct >= 0.4) return `${logged}/${goal} days — every entry matters. Keep building the habit! 💪`;
  return `${logged}/${goal} days — a fresh week ahead. You've got this! 🌱`;
}

const SYMPTOMS = [
  { key: "fatigue"   as const, label: "Fatigue",   emoji: "🔋" },
  { key: "pain"      as const, label: "Pain",       emoji: "⚡" },
  { key: "brain_fog" as const, label: "Brain Fog",  emoji: "🌫️" },
  { key: "mood"      as const, label: "Mood",       emoji: "😊" },
  { key: "mobility"  as const, label: "Mobility",   emoji: "🚶" },
] as const;

/* ── component ───────────────────────────────────────────── */
const MondayRecapCard = () => {
  // Only render on Mondays (temporarily Wednesday for preview)
  const day = new Date().getDay();
  const isMonday = day === 1 || day === 3;

  // Dismissal — keyed to this Monday so it reappears next Monday
  const thisMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const dismissKey = `recap_dismissed_${thisMonday}`;
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(dismissKey));

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  };

  // Last week's date range (Mon → Sun)
  const lastWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const lastWeekEnd   = format(endOfWeek(subWeeks(new Date(), 1),   { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: entries = [], isLoading: entriesLoading } = useEntriesInRange(lastWeekStart, lastWeekEnd);
  const { data: profile, isLoading: profileLoading }      = useProfile();

  const stats = useMemo(() => ({
    daysLogged:  entries.length,
    fatigue:     avg(entries.map(e => e.fatigue)),
    pain:        avg(entries.map(e => e.pain)),
    brain_fog:   avg(entries.map(e => e.brain_fog)),
    mood:        avg(entries.map(e => e.mood)),
    mobility:    avg(entries.map(e => e.mobility)),
    sleep_hours: avg(entries.map(e => e.sleep_hours)),
  }), [entries]);

  if (!isMonday || dismissed || entriesLoading || profileLoading) return null;

  const goal = profile?.weekly_log_goal ?? 7;
  const progressPct = Math.min((stats.daysLogged / goal) * 100, 100);
  const goalHit = stats.daysLogged >= goal;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Last Week Recap</p>
            <p className="text-[11px] text-muted-foreground">
              {format(new Date(lastWeekStart + "T00:00:00"), "MMM d")} – {format(new Date(lastWeekEnd + "T00:00:00"), "MMM d")}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Dismiss recap"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Days logged + progress bar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Days logged</span>
          <span className={`text-xs font-bold tabular-nums ${goalHit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {stats.daysLogged}/{goal}
            {goalHit && " ✓"}
          </span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
              goalHit ? "bg-emerald-500 dark:bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Symptom averages */}
      {entries.length > 0 && (
        <div className="px-4 py-2">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avg Symptoms</p>
          <div className="grid grid-cols-3 gap-1.5">
            {SYMPTOMS.map(({ key, label, emoji }) => {
              const val = stats[key];
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center rounded-xl px-1 py-2 ${val !== null ? scoreBg(val) : "bg-muted/40"}`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className={`mt-1 text-sm font-bold tabular-nums leading-none ${val !== null ? scoreColor(val) : "text-muted-foreground"}`}>
                    {val !== null ? val.toFixed(1) : "–"}
                  </span>
                  <span className="mt-0.5 text-center text-[9px] leading-tight text-muted-foreground">{label}</span>
                </div>
              );
            })}
            {/* Sleep tile — inverted scale */}
            {(() => {
              const s = stats.sleep_hours;
              return (
                <div className={`flex flex-col items-center rounded-xl px-1 py-2 ${s !== null ? sleepBg(s) : "bg-muted/40"}`}>
                  <span className="text-base leading-none">💤</span>
                  <span className={`mt-1 text-sm font-bold tabular-nums leading-none ${s !== null ? sleepColor(s) : "text-muted-foreground"}`}>
                    {s !== null ? `${s.toFixed(1)}h` : "–"}
                  </span>
                  <span className="mt-0.5 text-center text-[9px] leading-tight text-muted-foreground">Sleep</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Motivational message */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {motivation(stats.daysLogged, goal)}
        </p>
      </div>
    </div>
  );
};

export default MondayRecapCard;
