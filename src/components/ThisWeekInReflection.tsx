import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isToday, isFuture } from "date-fns";
import { getPromptForDate } from "@/lib/dailyPrompts";
import { buildHtmlDocument, downloadBlob, htmlBlob, escapeHtml } from "@/lib/browser-export";
import { DailyEntry } from "@/hooks/useEntries";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2, Circle, Copy, Check, Share2, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

function generateWeekExport(
  weekDays: Date[],
  entriesByDate: Record<string, DailyEntry>,
  reflectedCount: number,
) {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "MMMM d");
  const weekEnd = format(today, "MMMM d, yyyy");

  const rows = weekDays
    .map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const entry = entriesByDate[key];
      const note = entry?.notes?.trim() ?? "(no reflection written)";
      const prompt = getPromptForDate(day);
      const scores = [
        ["Pain", entry?.pain],
        ["Fatigue", entry?.fatigue],
        ["Mood", entry?.mood],
        ["Brain Fog", entry?.brain_fog],
      ]
        .map(([label, value]) => `${label}: ${value ?? "—"}/10`)
        .join(" · ");

      return `<tr>
        <td>${escapeHtml(format(day, "EEEE, MMM d"))}</td>
        <td>${escapeHtml(prompt)}</td>
        <td>${escapeHtml(scores)}</td>
        <td>${escapeHtml(note)}</td>
      </tr>`;
    })
    .join("");

  const html = buildHtmlDocument("My week in reflection", [
    {
      heading: "Overview",
      body: `<p>${escapeHtml(`${weekStart} – ${weekEnd}`)}</p><p>${escapeHtml(`${reflectedCount} day${reflectedCount === 1 ? "" : "s"} reflected this week`)}</p>`,
    },
    {
      heading: "Daily reflections",
      body: `<table><thead><tr><th>Day</th><th>Prompt</th><th>Symptom snapshot</th><th>Reflection</th></tr></thead><tbody>${rows}</tbody></table>`,
    },
  ]);

  downloadBlob(
    htmlBlob(html),
    `reflection-week-${format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")}.html`,
  );
}

/* ── Per-day row with expand/collapse ─────────────────────── */
interface DayRowProps {
  day: Date;
  entriesByDate: Record<string, DailyEntry>;
  navigate: ReturnType<typeof useNavigate>;
}

const NOTE_THRESHOLD = 160;
const canShare = typeof navigator !== "undefined" && !!navigator.share;

const DayRow = ({ day, entriesByDate, navigate }: DayRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const key = format(day, "yyyy-MM-dd");
  const entry = entriesByDate[key];
  const prompt = getPromptForDate(day);
  const note = entry?.notes?.trim() ?? null;
  const dayIsToday = isToday(day);
  const isLong = !!note && note.length > NOTE_THRESHOLD;

  const handleShare = async () => {
    if (!note) return;
    const text = `${format(day, "EEEE, MMMM d")}\n💭 ${prompt}\n\n${note}`;
    if (canShare) {
      try {
        await navigator.share({ title: "My reflection", text });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-4 py-3 space-y-1">
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
              onClick={handleShare}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              title={canShare ? "Share" : "Copy to clipboard"}
            >
              {copied ? (
                <><Check className="h-2.5 w-2.5 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
              ) : canShare ? (
                <><Share2 className="h-2.5 w-2.5" />Share</>
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

      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
        💭 {prompt}
      </p>

      {note ? (
        <div className="space-y-1">
          <p className={`text-sm text-foreground leading-relaxed transition-all ${!expanded && isLong ? "line-clamp-3" : ""}`}>
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
        <p className="text-[11px] text-muted-foreground/60">No reflection written yet.</p>
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
  const [weekCopied, setWeekCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
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

  const buildWeekText = () => {
    const today = new Date();
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "MMMM d");
    const weekEnd = format(today, "MMMM d, yyyy");
    const lines = weekDays.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const entry = entriesByDate[key];
      const note = entry?.notes?.trim();
      const prompt = getPromptForDate(day);
      const dayLabel = format(day, "EEEE, MMMM d");
      const scores = entry
        ? `Pain: ${entry.pain ?? "—"}/10 · Fatigue: ${entry.fatigue ?? "—"}/10 · Mood: ${entry.mood ?? "—"}/10 · Brain Fog: ${entry.brain_fog ?? "—"}/10`
        : null;
      return [
        dayLabel,
        scores ? `📊 ${scores}` : null,
        `💭 ${prompt}`,
        note ?? "(no reflection written)",
      ].filter(Boolean).join("\n");
    });
    return `My week in reflection — ${weekStart}–${weekEnd}\n${"─".repeat(40)}\n\n${lines.join("\n\n")}`;
  };

  const handleShareWeek = async () => {
    const text = buildWeekText();
    if (canShare) {
      try {
        await navigator.share({ title: "My week in reflection", text });
        return;
      } catch {
        // cancelled
      }
    }
    navigator.clipboard.writeText(text).then(() => {
      setWeekCopied(true);
      setTimeout(() => setWeekCopied(false), 2500);
    });
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      generateWeekExport(weekDays, entriesByDate, reflectedCount);
      setExporting(false);
    }, 50);
  };

  return (
    <section className="space-y-2 animate-fade-in">
      <div className="px-1 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          This week in reflection
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Download reflection summary"
          >
            <FileDown className="h-2.5 w-2.5" />
            {exporting ? "Preparing…" : "Export"}
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
