import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Entry {
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
}

interface DigestPreviewCardProps {
  entries: Entry[];
  weekStart: string;
  weekEnd: string;
  weeklyLogGoal: number;
  weekStreak: number;
}

function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// For most symptoms: low = good (green), high = bad (red)
// For mood: high = good (green), low = bad (red)  → pass inverted=true
function levelColor(v: number | null, inverted = false): string {
  if (v === null) return "text-muted-foreground";
  if (!inverted) {
    if (v <= 3) return "text-emerald-600 dark:text-emerald-400";
    if (v <= 6) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  } else {
    if (v >= 7) return "text-emerald-600 dark:text-emerald-400";
    if (v >= 4) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }
}

function levelWord(v: number | null, inverted = false): string {
  if (v === null) return "—";
  if (!inverted) {
    if (v <= 3) return "Low";
    if (v <= 6) return "Moderate";
    return "High";
  } else {
    if (v >= 7) return "Good";
    if (v >= 4) return "Fair";
    return "Low";
  }
}

function fmt(v: number | null, unit = "/10"): string {
  return v !== null ? `${v.toFixed(1)}${unit}` : "—";
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
}

const METRICS: { key: keyof Entry; label: string; inverted?: boolean }[] = [
  { key: "fatigue", label: "Fatigue" },
  { key: "pain", label: "Pain" },
  { key: "brain_fog", label: "Brain Fog" },
  { key: "mood", label: "Mood", inverted: true },
  { key: "mobility", label: "Mobility" },
];

export default function DigestPreviewCard({
  entries,
  weekStart,
  weekEnd,
  weeklyLogGoal,
  weekStreak,
}: DigestPreviewCardProps) {
  const [open, setOpen] = useState(false);

  const daysLogged = entries.length;
  const goalAchieved = daysLogged >= weeklyLogGoal;

  const avgValues: Record<string, number | null> = {
    fatigue: avg(entries.map((e) => e.fatigue)),
    pain: avg(entries.map((e) => e.pain)),
    brain_fog: avg(entries.map((e) => e.brain_fog)),
    mood: avg(entries.map((e) => e.mood)),
    mobility: avg(entries.map((e) => e.mobility)),
  };
  const avgSleep = avg(entries.map((e) => e.sleep_hours));

  const streakLabel =
    weekStreak === 0
      ? `${daysLogged} of ${weeklyLogGoal}-day goal logged`
      : weekStreak === 1
      ? "Week 1 goal hit — keep it up! ⚡"
      : `Week ${weekStreak} in a row! 🔥`;

  return (
    <div className="mt-2 rounded-lg border border-border bg-background overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-medium text-foreground">Preview this week's digest</span>
        </div>
        {open ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
          {/* Email-style header */}
          <div className="rounded-md bg-primary/8 border border-primary/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">
              Weekly Health Digest
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDateRange(weekStart, weekEnd)}
            </p>
          </div>

          {/* Goal summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                {goalAchieved
                  ? `✅ Goal reached — ${daysLogged}/${weeklyLogGoal} days logged!`
                  : `📋 ${daysLogged} of ${weeklyLogGoal} days logged`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{streakLabel}</p>
            </div>
            {weekStreak >= 2 && (
              <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                {weekStreak} wk 🔥
              </span>
            )}
          </div>

          {/* Symptom metrics grid */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Symptom Averages
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {METRICS.map(({ key, label, inverted }) => {
                const val = avgValues[key as string];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md bg-secondary/60 px-2.5 py-1.5"
                  >
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <div className="text-right">
                      <span className={`text-[11px] font-semibold ${levelColor(val, inverted)}`}>
                        {fmt(val)}
                      </span>
                      <span className={`ml-1 text-[9px] ${levelColor(val, inverted)}`}>
                        {levelWord(val, inverted)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Sleep spans full width */}
              <div className="col-span-2 flex items-center justify-between rounded-md bg-secondary/60 px-2.5 py-1.5">
                <span className="text-[10px] text-muted-foreground">Sleep</span>
                <span className="text-[11px] font-semibold text-foreground">
                  {fmt(avgSleep, " hrs")}
                </span>
              </div>
            </div>
          </div>

          {entries.length === 0 && (
            <p className="text-center text-[11px] text-muted-foreground py-2">
              No entries logged this week yet — start tracking to see your digest preview.
            </p>
          )}

          <p className="text-[9px] text-muted-foreground text-center pt-1">
            This is a preview of the email sent to your inbox every Monday
          </p>
        </div>
      )}
    </div>
  );
}
