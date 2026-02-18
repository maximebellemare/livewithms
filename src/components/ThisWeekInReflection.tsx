import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isToday, isFuture } from "date-fns";
import { getPromptForDate } from "@/lib/dailyPrompts";
import { DailyEntry } from "@/hooks/useEntries";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2, Circle, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── Per-day row with expand/collapse ─────────────────────── */
interface DayRowProps {
  day: Date;
  entriesByDate: Record<string, DailyEntry>;
  navigate: ReturnType<typeof useNavigate>;
}

const NOTE_THRESHOLD = 160; // characters before we show expand

const DayRow = ({ day, entriesByDate, navigate }: DayRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const key = format(day, "yyyy-MM-dd");
  const entry = entriesByDate[key];
  const prompt = getPromptForDate(day);
  const note = entry?.notes?.trim() ?? null;
  const dayIsToday = isToday(day);
  const isLong = !!note && note.length > NOTE_THRESHOLD;

  const handleCopy = () => {
    if (!note) return;
    const text = `${format(day, "EEEE, MMMM d")}\n💭 ${prompt}\n\n${note}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-4 py-3 space-y-1">
      {/* Day label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {note ? (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <Circle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/30" />
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {dayIsToday ? "Today" : format(day, "EEE, MMM d")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {note && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <><Check className="h-2.5 w-2.5 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
              ) : (
                <><Copy className="h-2.5 w-2.5" />Copy</>
              )}
            </button>
          )}
          {dayIsToday && !note && (
            <button
              onClick={() => navigate("/journal")}
              className="flex items-center gap-1 text-[10px] font-medium text-primary hover:opacity-80 transition-opacity"
            >
              <PenLine className="h-2.5 w-2.5" />
              Write now
            </button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
        💭 {prompt}
      </p>

      {/* Note or empty state */}
      {note ? (
        <div className="space-y-1">
          <p
            className={`text-sm text-foreground leading-relaxed transition-all ${
              !expanded && isLong ? "line-clamp-3" : ""
            }`}
          >
            {note}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Show less</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Show more</>
              )}
            </button>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/60">
          No reflection written yet.
        </p>
      )}
    </div>
  );
};

/* ── Main component ────────────────────────────────────────── */
interface Props {
  entries: DailyEntry[];
}

const ThisWeekInReflection = ({ entries }: Props) => {
  const navigate = useNavigate();
  const today = new Date();
  const [weekCopied, setWeekCopied] = useState(false);

  const weekDays = useMemo(() => {
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter(
      (d) => !isFuture(d) || isToday(d)
    );
  }, []);

  const entriesByDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries]
  );

  const reflectedCount = weekDays.filter((d) => {
    const key = format(d, "yyyy-MM-dd");
    return !!entriesByDate[key]?.notes?.trim();
  }).length;

  if (reflectedCount === 0) return null;

  const total = weekDays.length;
  const allDone = reflectedCount === total;
  const badgeEmoji = allDone ? "🔥" : reflectedCount >= Math.ceil(total / 2) ? "⚡" : "💭";

  const motivationalMessage =
    allDone
      ? "Perfect week — every day reflected! 🎉"
      : reflectedCount >= total - 1
      ? "Almost there — one more to go!"
      : reflectedCount >= Math.ceil(total / 2)
      ? "Keep it up — you're on a roll!"
      : reflectedCount === 2
      ? "Good start — build the habit!"
      : "Great start — keep writing!";

  const handleCopyWeek = () => {
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "MMMM d");
    const weekEnd = format(today, "MMMM d, yyyy");
    const lines = weekDays.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const note = entriesByDate[key]?.notes?.trim();
      const prompt = getPromptForDate(day);
      const dayLabel = format(day, "EEEE, MMMM d");
      return note
        ? `${dayLabel}\n💭 ${prompt}\n${note}`
        : `${dayLabel}\n💭 ${prompt}\n(no reflection written)`;
    });
    const text = `My week in reflection — ${weekStart}–${weekEnd}\n${"─".repeat(40)}\n\n${lines.join("\n\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      setWeekCopied(true);
      setTimeout(() => setWeekCopied(false), 2500);
    });
  };

  return (
    <section className="space-y-2 animate-fade-in">
      <div className="px-1 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          This week in reflection
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyWeek}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Copy whole week to clipboard"
          >
            {weekCopied ? (
              <><Check className="h-2.5 w-2.5 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
            ) : (
              <><Copy className="h-2.5 w-2.5" />Copy week</>
            )}
          </button>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            allDone
              ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
              : reflectedCount >= Math.ceil(total / 2)
              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
              : "bg-primary/10 text-primary"
          }`}>
            {badgeEmoji} {reflectedCount} of {total} day{total !== 1 ? "s" : ""} reflected
          </span>
        </div>
      </div>
      <p className="px-1 text-[11px] text-muted-foreground -mt-1">{motivationalMessage}</p>
      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden divide-y divide-border">
        {weekDays.map((day) => (
          <DayRow
            key={format(day, "yyyy-MM-dd")}
            day={day}
            entriesByDate={entriesByDate}
            navigate={navigate}
          />
        ))}
      </div>
    </section>
  );
};

export default ThisWeekInReflection;
