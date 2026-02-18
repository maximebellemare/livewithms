import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isToday, isFuture } from "date-fns";
import { getPromptForDate } from "@/lib/dailyPrompts";
import { DailyEntry } from "@/hooks/useEntries";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2, Circle, Copy, Check, Share2, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

/* ── PDF generator ─────────────────────────────────────────── */
function generateWeekPDF(
  weekDays: Date[],
  entriesByDate: Record<string, DailyEntry>,
  reflectedCount: number
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "MMMM d");
  const weekEnd = format(today, "MMMM d, yyyy");

  /* ── Colour palette ── */
  const ORANGE   = [234, 88,  12]  as [number, number, number]; // primary
  const DARK     = [15,  15,  15]  as [number, number, number];
  const GREY     = [100, 100, 100] as [number, number, number];
  const LIGHT_BG = [250, 247, 244] as [number, number, number];
  const DIVIDER  = [220, 210, 200] as [number, number, number];
  const GREEN    = [16,  185, 129] as [number, number, number];

  /* ── Header banner ── */
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 42, "F");

  doc.setFillColor(255, 255, 255, 0.08 as any);
  doc.circle(pageW - 12, -8, 28, "F");
  doc.circle(pageW - 30, 5, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("My Week in Reflection", margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${weekStart} – ${weekEnd}`, margin, 24);

  /* Progress pill */
  const total = weekDays.length;
  const pillText = `${reflectedCount} of ${total} days reflected`;
  const pillW = doc.getStringUnitWidth(pillText) * 10 / doc.internal.scaleFactor + 8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 29, pillW, 7, 3.5, 3.5, "F");
  doc.setTextColor(...ORANGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(pillText, margin + 4, 34);

  /* Generated timestamp */
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Generated ${format(today, "PPP")}`, pageW - margin, 37, { align: "right" });

  /* ── Body ── */
  let y = 52;

  weekDays.forEach((day, idx) => {
    const key = format(day, "yyyy-MM-dd");
    const entry = entriesByDate[key];
    const note = entry?.notes?.trim() ?? null;
    const prompt = getPromptForDate(day);
    const dayLabel = format(day, "EEEE, MMMM d");
    const hasNote = !!note;

    /* Card background */
    doc.setFillColor(...LIGHT_BG);
    const cardX = margin;
    const cardY = y;

    /* Estimate card height to check for page break later */
    const noteLines = note
      ? doc.splitTextToSize(note, contentW - 10)
      : ["(no reflection written)"];
    const promptLines = doc.splitTextToSize(`"${prompt}"`, contentW - 10);
    const cardH = 6 + 5 + promptLines.length * 4.5 + 3 + noteLines.length * 4.5 + 6;

    if (y + cardH > pageH - 20) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(cardX, y, contentW, cardH, 3, 3, "F");

    /* Left accent bar */
    doc.setFillColor(...(hasNote ? GREEN : DIVIDER));
    doc.roundedRect(cardX, y, 3, cardH, 1.5, 1.5, "F");

    /* Day header */
    y += 5;
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(dayLabel, cardX + 8, y);

    /* Tick / circle */
    if (hasNote) {
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("✓", pageW - margin - 4, y, { align: "right" });
    }

    /* Prompt */
    y += 5;
    doc.setTextColor(...GREY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    promptLines.forEach((line: string) => {
      doc.text(line, cardX + 8, y);
      y += 4.5;
    });

    /* Divider */
    y += 1;
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.2);
    doc.line(cardX + 8, y, cardX + contentW - 4, y);
    y += 3;

    /* Note content */
    doc.setTextColor(hasNote ? DARK[0] : GREY[0], hasNote ? DARK[1] : GREY[1], hasNote ? DARK[2] : GREY[2]);
    doc.setFont("helvetica", hasNote ? "normal" : "italic");
    doc.setFontSize(9.5);
    noteLines.forEach((line: string) => {
      doc.text(line, cardX + 8, y);
      y += 4.5;
    });

    y += 7; // gap between cards

    /* Section divider line between days (not after last) */
    if (idx < weekDays.length - 1) {
      doc.setDrawColor(...DIVIDER);
      doc.setLineWidth(0.1);
    }
  });

  /* ── Footer ── */
  const footerY = pageH - 10;
  doc.setFillColor(...ORANGE);
  doc.rect(0, footerY - 4, pageW, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Generated with MS Journal · This is not medical advice.", margin, footerY + 1);
  doc.text(`Page 1`, pageW - margin, footerY + 1, { align: "right" });

  /* ── Save ── */
  const filename = `reflection-week-${format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
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
  const [exporting, setExporting] = useState(false);

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

  const buildWeekText = () => {
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
    return `My week in reflection — ${weekStart}–${weekEnd}\n${"─".repeat(40)}\n\n${lines.join("\n\n")}`;
  };

  const handleShareWeek = async () => {
    const text = buildWeekText();
    if (canShare) {
      try {
        await navigator.share({ title: "My week in reflection", text });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    navigator.clipboard.writeText(text).then(() => {
      setWeekCopied(true);
      setTimeout(() => setWeekCopied(false), 2500);
    });
  };

  const handleExportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      generateWeekPDF(weekDays, entriesByDate, reflectedCount);
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
          {/* PDF export */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Download PDF report"
          >
            <FileDown className="h-2.5 w-2.5" />
            {exporting ? "Generating…" : "PDF"}
          </button>

          {/* Share / copy */}
          <button
            onClick={handleShareWeek}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            title={canShare ? "Share whole week" : "Copy whole week to clipboard"}
          >
            {weekCopied ? (
              <><Check className="h-2.5 w-2.5 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
            ) : canShare ? (
              <><Share2 className="h-2.5 w-2.5" />Share</>
            ) : (
              <><Copy className="h-2.5 w-2.5" />Copy</>
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
