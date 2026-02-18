import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isToday, isFuture } from "date-fns";
import { getPromptForDate } from "@/lib/dailyPrompts";
import { DailyEntry } from "@/hooks/useEntries";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2, Circle, Copy, Check, Share2, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

/* ── helpers ───────────────────────────────────────────────── */
const ORANGE   = [234, 88,  12]  as [number, number, number];
const DARK     = [15,  15,  15]  as [number, number, number];
const GREY     = [110, 110, 110] as [number, number, number];
const LIGHT_BG = [250, 247, 244] as [number, number, number];
const DIVIDER  = [220, 210, 200] as [number, number, number];
const GREEN    = [16,  185, 129] as [number, number, number];
const AMBER    = [217, 119, 6]   as [number, number, number];
const RED      = [220, 38,  38]  as [number, number, number];

/** Map a 0-10 score to a traffic-light colour */
function scoreColour(v: number): [number, number, number] {
  if (v <= 3) return GREEN;
  if (v <= 6) return AMBER;
  return RED;
}

/** Draw a small filled pill bar representing a score */
function drawScorePill(
  doc: jsPDF,
  label: string,
  value: number | null,
  x: number,
  y: number,
  colW: number
) {
  const barW = colW - 14;
  const barH = 2.2;
  const score = value ?? null;

  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(label, x, y);

  if (score === null) {
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(x, y + 1.5, x + barW, y + 1.5);
    doc.setTextColor(...GREY);
    doc.setFontSize(6.5);
    doc.text("—", x + barW + 1.5, y + 1.5);
    return;
  }

  // Track (background)
  doc.setFillColor(...DIVIDER);
  doc.roundedRect(x, y + 0.8, barW, barH, 1, 1, "F");

  // Fill
  const fillW = (score / 10) * barW;
  const col = scoreColour(score);
  doc.setFillColor(...col);
  doc.roundedRect(x, y + 0.8, fillW, barH, 1, 1, "F");

  // Label
  doc.setTextColor(...col);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(`${score}/10`, x + barW + 1.5, y + 2.5);
}

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

  /* ── Header banner ── */
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 44, "F");

  // Decorative circles
  doc.setFillColor(255, 255, 255);
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.circle(pageW - 10, -6, 30, "F");
  doc.circle(pageW - 32, 8, 16, "F");
  (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("My Week in Reflection", margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${weekStart} – ${weekEnd}`, margin, 24);

  // Progress pill
  const total = weekDays.length;
  const pillText = `${reflectedCount} of ${total} days reflected`;
  const pillW = doc.getStringUnitWidth(pillText) * 10 / doc.internal.scaleFactor + 8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 29, pillW, 7, 3.5, 3.5, "F");
  doc.setTextColor(...ORANGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(pillText, margin + 4, 34);

  // Generated date
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Generated ${format(today, "PPP")}`, pageW - margin, 38, { align: "right" });

  /* ── Legend ── */
  let y = 52;
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "italic");
  doc.text("Symptom scores: 0–3 = mild (green) · 4–6 = moderate (amber) · 7–10 = severe (red)", margin, y);
  y += 7;

  /* ── Day cards ── */
  weekDays.forEach((day) => {
    const key = format(day, "yyyy-MM-dd");
    const entry = entriesByDate[key];
    const note = entry?.notes?.trim() ?? null;
    const prompt = getPromptForDate(day);
    const dayLabel = format(day, "EEEE, MMMM d");
    const hasNote = !!note;

    const noteLines   = doc.splitTextToSize(note ?? "(no reflection written)", contentW - 10);
    const promptLines = doc.splitTextToSize(`"${prompt}"`, contentW - 10);

    const hasSymptoms = entry && (
      entry.pain !== null || entry.fatigue !== null ||
      entry.mood !== null || entry.brain_fog !== null
    );

    // Card height: header + prompt + divider + note + optional symptom rows + padding
    const symptomH = hasSymptoms ? 22 : 0;
    const cardH = 6 + promptLines.length * 4.5 + 3 + noteLines.length * 4.5 + symptomH + 8;

    if (y + cardH > pageH - 20) {
      doc.addPage();
      y = 20;
    }

    // Card background
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, contentW, cardH, 3, 3, "F");

    // Left accent bar
    doc.setFillColor(...(hasNote ? GREEN : DIVIDER));
    doc.roundedRect(margin, y, 3, cardH, 1.5, 1.5, "F");

    // Day label
    y += 5.5;
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(dayLabel, margin + 8, y);

    if (hasNote) {
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("✓", pageW - margin - 4, y, { align: "right" });
    }

    // Prompt
    y += 5;
    doc.setTextColor(...GREY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    promptLines.forEach((line: string) => {
      doc.text(line, margin + 8, y);
      y += 4.5;
    });

    // Divider
    y += 1;
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.2);
    doc.line(margin + 8, y, margin + contentW - 4, y);
    y += 3.5;

    // Note text
    doc.setTextColor(hasNote ? DARK[0] : GREY[0], hasNote ? DARK[1] : GREY[1], hasNote ? DARK[2] : GREY[2]);
    doc.setFont("helvetica", hasNote ? "normal" : "italic");
    doc.setFontSize(9.5);
    noteLines.forEach((line: string) => {
      doc.text(line, margin + 8, y);
      y += 4.5;
    });

    // ── Symptom scores section ──
    if (hasSymptoms) {
      y += 3;

      // Mini section label
      doc.setTextColor(...GREY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("SYMPTOM SCORES", margin + 8, y);
      y += 3;

      // Thin rule
      doc.setDrawColor(...DIVIDER);
      doc.setLineWidth(0.15);
      doc.line(margin + 8, y, margin + contentW - 4, y);
      y += 4;

      // 4 pills in a 2×2 grid
      const colW = (contentW - 8) / 2;
      const col1 = margin + 8;
      const col2 = margin + 8 + colW;

      drawScorePill(doc, "Pain",      entry.pain,      col1, y, colW);
      drawScorePill(doc, "Fatigue",   entry.fatigue,   col2, y, colW);
      y += 8;
      drawScorePill(doc, "Mood",      entry.mood,      col1, y, colW);
      drawScorePill(doc, "Brain Fog", entry.brain_fog, col2, y, colW);
      y += 5;
    }

    y += 6; // gap between cards
  });

  /* ── Footer ── */
  const footerY = pageH - 10;
  doc.setFillColor(...ORANGE);
  doc.rect(0, footerY - 4, pageW, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Generated with MS Journal · This is not medical advice.", margin, footerY + 1);
  doc.text("Page 1", pageW - margin, footerY + 1, { align: "right" });

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
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Download PDF report"
          >
            <FileDown className="h-2.5 w-2.5" />
            {exporting ? "Generating…" : "PDF"}
          </button>

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
