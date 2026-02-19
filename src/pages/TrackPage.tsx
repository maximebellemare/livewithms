import { useMemo, useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, subMonths, addMonths, isSameDay, isToday,
  parseISO,
} from "date-fns";
import PageHeader from "@/components/PageHeader";
import { Calendar, List, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEntries, DailyEntry } from "@/hooks/useEntries";

/* ─── helpers ────────────────────────────────────────────── */
const SYMPTOM_KEYS: (keyof DailyEntry)[] = ["fatigue", "pain", "brain_fog", "mood", "mobility", "spasticity", "stress"];

function overallScore(entry: DailyEntry): number {
  const vals = SYMPTOM_KEYS.map((k) => entry[k] as number | null).filter((v): v is number => v !== null);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Returns Tailwind bg + text colour classes based on 0-10 severity */
function heatColor(score: number): { bg: string; text: string; label: string } {
  if (score === 0) return { bg: "bg-muted/50",                         text: "text-muted-foreground", label: "None logged" };
  if (score < 2)   return { bg: "bg-emerald-100 dark:bg-emerald-950",  text: "text-emerald-700 dark:text-emerald-300", label: "Very mild" };
  if (score < 4)   return { bg: "bg-lime-100 dark:bg-lime-950",        text: "text-lime-700 dark:text-lime-300",       label: "Mild" };
  if (score < 6)   return { bg: "bg-amber-100 dark:bg-amber-950",      text: "text-amber-700 dark:text-amber-300",     label: "Moderate" };
  if (score < 8)   return { bg: "bg-orange-200 dark:bg-orange-950",    text: "text-orange-700 dark:text-orange-300",   label: "High" };
  return             { bg: "bg-red-200 dark:bg-red-950",               text: "text-red-700 dark:text-red-300",         label: "Severe" };
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SYMPTOM_DISPLAY = [
  { key: "fatigue",    label: "Fatigue",    emoji: "🔋" },
  { key: "pain",       label: "Pain",       emoji: "⚡" },
  { key: "brain_fog",  label: "Brain Fog",  emoji: "🌫️" },
  { key: "mood",       label: "Mood",       emoji: "😊" },
  { key: "mobility",   label: "Mobility",   emoji: "🚶" },
  { key: "spasticity", label: "Spasticity", emoji: "🦵" },
  { key: "stress",     label: "Stress",     emoji: "😰" },
] as const;

/* ─── Detail popover ─────────────────────────────────────── */
interface DayDetailProps {
  date: Date;
  entry: DailyEntry | null;
  onClose: () => void;
}

const DayDetail = ({ date, entry, onClose }: DayDetailProps) => (
  <div className="animate-fade-in rounded-2xl bg-card border border-border shadow-card p-4 mt-3">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-semibold text-foreground">
        {format(date, "EEEE, MMMM d")}
      </p>
      <button
        onClick={onClose}
        className="rounded-full p-1 text-muted-foreground hover:bg-secondary transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    {!entry ? (
      <p className="text-sm text-muted-foreground text-center py-2">No entry logged for this day.</p>
    ) : (
      <>
        <div className="grid grid-cols-7 gap-2 text-center mb-3">
          {SYMPTOM_DISPLAY.map(({ key, label, emoji }) => {
            const val = entry[key as keyof DailyEntry] as number | null;
            return (
              <div key={key}>
                <span className="text-base">{emoji}</span>
                <p className="text-lg font-bold text-foreground">{val ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            );
          })}
        </div>

        {entry.sleep_hours !== null && (
          <p className="text-xs text-muted-foreground mb-2">
            💤 <strong className="text-foreground">{entry.sleep_hours}h</strong> sleep
          </p>
        )}

        {entry.mood_tags && entry.mood_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {entry.mood_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {entry.notes && (
          <p className="text-xs text-muted-foreground italic">"{entry.notes}"</p>
        )}
      </>
    )}
  </div>
);

/* ─── Calendar heatmap ───────────────────────────────────── */
interface HeatmapProps {
  month: Date;
  entriesByDate: Record<string, DailyEntry>;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}

const CalendarHeatmap = ({ month, entriesByDate, selectedDate, onSelectDate }: HeatmapProps) => {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDow = getDay(days[0]); // 0=Sun offset

  return (
    <div className="rounded-2xl bg-card border border-border shadow-soft p-4">
      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = entriesByDate[key] ?? null;
          const score = entry ? overallScore(entry) : 0;
          const { bg, text } = heatColor(score);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center justify-center rounded-lg aspect-square
                text-[11px] font-medium transition-all active:scale-95
                ${bg} ${text}
                ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""}
                ${today ? "font-bold" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {entry && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-current opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground mr-1">Severity:</span>
        {[
          { label: "None",     bg: "bg-muted/50" },
          { label: "Mild",     bg: "bg-lime-100 dark:bg-lime-950" },
          { label: "Moderate", bg: "bg-amber-100 dark:bg-amber-950" },
          { label: "High",     bg: "bg-orange-200 dark:bg-orange-950" },
          { label: "Severe",   bg: "bg-red-200 dark:bg-red-950" },
        ].map(({ label, bg }) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`h-3 w-3 rounded-sm ${bg} border border-border/50`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── Main page ──────────────────────────────────────────── */
const TrackPage = () => {
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: entries = [], isLoading } = useEntries();

  const entriesByDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries],
  );

  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    return entriesByDate[format(selectedDate, "yyyy-MM-dd")] ?? null;
  }, [selectedDate, entriesByDate]);

  const handleSelectDate = (d: Date) => {
    setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d));
  };

  return (
    <>
      <PageHeader
        title="Track"
        subtitle="Your symptom history"
        action={
          <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
            <button
              onClick={() => setView("list")}
              className={`rounded-md p-1.5 transition-colors ${view === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`rounded-md p-1.5 transition-colors ${view === "calendar" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-lg px-4 py-4 pb-8">
        {isLoading ? (
          <div className="py-16 text-center"><span className="text-2xl animate-pulse">🧡</span></div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center animate-fade-in">
            <span className="text-4xl">📊</span>
            <p className="mt-3 font-display text-lg font-medium text-foreground">No entries yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Head to Today and log your first entry!</p>
          </div>
        ) : view === "calendar" ? (
          /* ── Calendar view ── */
          <div className="animate-fade-in space-y-3">
            {/* Month navigator */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => { setMonth((m) => subMonths(m, 1)); setSelectedDate(null); }}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-base font-semibold text-foreground">
                {format(month, "MMMM yyyy")}
              </p>
              <button
                onClick={() => { setMonth((m) => addMonths(m, 1)); setSelectedDate(null); }}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <CalendarHeatmap
              month={month}
              entriesByDate={entriesByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            {/* Day detail popover */}
            {selectedDate && (
              <DayDetail
                date={selectedDate}
                entry={selectedEntry}
                onClose={() => setSelectedDate(null)}
              />
            )}

            {/* Month summary stats */}
            {(() => {
              const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
              const monthEnd   = format(endOfMonth(month),   "yyyy-MM-dd");
              const monthEntries = entries.filter((e) => e.date >= monthStart && e.date <= monthEnd);
              if (!monthEntries.length) return null;
              const scores = monthEntries.map(overallScore);
              const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
              const worstDay = monthEntries.reduce((a, b) => overallScore(a) > overallScore(b) ? a : b);
              const bestDay  = monthEntries.reduce((a, b) => overallScore(a) < overallScore(b) ? a : b);
              return (
                <div className="rounded-2xl bg-card border border-border shadow-soft p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {format(month, "MMMM")} summary
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-foreground">{monthEntries.length}</p>
                      <p className="text-[10px] text-muted-foreground">Days logged</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{avgScore.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">Avg severity</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">
                        {Math.round((monthEntries.length / new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) * 100)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Logged days</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>
                      🟢 Best:{" "}
                      <strong className="text-foreground">
                        {format(parseISO(bestDay.date), "MMM d")}
                      </strong>{" "}
                      ({overallScore(bestDay).toFixed(1)})
                    </span>
                    <span>
                      🔴 Hardest:{" "}
                      <strong className="text-foreground">
                        {format(parseISO(worstDay.date), "MMM d")}
                      </strong>{" "}
                      ({overallScore(worstDay).toFixed(1)})
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* ── List view ── */
          <div className="space-y-3 animate-fade-in">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-card p-4 shadow-soft">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(parseISO(entry.date), "EEEE, MMM d")}
                  </p>
                  {(() => {
                    const score = overallScore(entry);
                    const { bg, text, label } = heatColor(score);
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${text}`}>
                        {label} · {score.toFixed(1)}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {SYMPTOM_DISPLAY.map(({ key, label, emoji }) => (
                    <div key={key}>
                      <span className="text-base">{emoji}</span>
                      <p className="text-lg font-bold text-foreground">
                        {(entry[key as keyof DailyEntry] as number | null) ?? "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                {entry.mood_tags && entry.mood_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.mood_tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {entry.notes && (
                  <p className="mt-2 text-xs text-muted-foreground italic">"{entry.notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TrackPage;
