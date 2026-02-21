import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import type { DailyEntry } from "@/hooks/useEntries";
import type { Profile } from "@/hooks/useProfile";
import type { DbMedication, DbMedicationLog } from "@/hooks/useMedications";
import type { DbAppointment } from "@/hooks/useAppointments";
import type { Relapse } from "@/hooks/useRelapses";
import { computeRisk, computeWeeklyScores } from "@/components/relapse-risk/computeRisk";

interface ReportData {
  startDate: string;
  endDate: string;
  includeSymptoms: boolean;
  includeMedications: boolean;
  includeAppointments: boolean;
  includeProfile: boolean;
  includeNotes: boolean;
  includeRelapses?: boolean;
  includeHydration?: boolean;
  includeRiskScore?: boolean;
  includeTrendCharts?: boolean;
  includeMoodTags?: boolean;
  includePeriodComparison?: boolean;
  includeTriggerAnalysis?: boolean;
  aiInsight?: string | null;
  entries: DailyEntry[];
  profile: Profile | null;
  medications: DbMedication[];
  medLogs: DbMedicationLog[];
  appointments: DbAppointment[];
  relapses?: Relapse[];
}


const ORANGE: [number, number, number] = [232, 117, 26];
const DARK: [number, number, number] = [31, 31, 31];
const GRAY: [number, number, number] = [120, 120, 120];
const LIGHT_BG: [number, number, number] = [252, 249, 246];
const WHITE: [number, number, number] = [255, 255, 255];

function addHeader(doc: jsPDF): number {
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("LiveWithMS", 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Doctor-Ready Health Report", 14, 21);
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 196, 14, { align: "right" });
  doc.text("⚕️ Not medical advice", 196, 21, { align: "right" });
  return 34;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFillColor(...ORANGE);
  doc.rect(14, y, 3, 8, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y + 6);
  return y + 14;
}

function addSubtext(doc: jsPDF, text: string, y: number): number {
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(text, 14, y);
  return y + 6;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) { doc.addPage(); return 20; }
  return y;
}

function drawTrendChart(
  doc: jsPDF,
  entries: DailyEntry[],
  y: number,
  title: string,
  getVal: (e: DailyEntry) => number | null | undefined,
  color: [number, number, number],
  maxVal: number,
  unitLabel: string,
): number {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const points = sorted
    .map((e) => ({ date: e.date, val: getVal(e) }))
    .filter((p): p is { date: string; val: number } => p.val != null);

  if (points.length < 2) return y;

  const chartX = 24;
  const chartW = 160;
  const chartH = 36;
  const chartTop = y;
  const chartBottom = chartTop + chartH;

  // Title
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, chartTop - 2);

  // Y-axis labels
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(String(maxVal), chartX - 2, chartTop + 3, { align: "right" });
  doc.text(String(Math.round(maxVal / 2)), chartX - 2, chartTop + chartH / 2 + 1, { align: "right" });
  doc.text("0", chartX - 2, chartBottom + 1, { align: "right" });

  // Grid lines
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.15);
  for (let i = 0; i <= 4; i++) {
    const gy = chartTop + (chartH / 4) * i;
    doc.line(chartX, gy, chartX + chartW, gy);
  }

  // Area fill
  const xStep = chartW / (points.length - 1);
  doc.setFillColor(color[0], color[1], color[2]);
  // Area fill region

  // Draw the line and collect coordinates
  const coords: { x: number; py: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const px = chartX + i * xStep;
    const normalized = Math.min(points[i].val / maxVal, 1);
    const py = chartBottom - normalized * chartH;
    coords.push({ x: px, py });
  }

  // Light fill under curve
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(color[0], color[1], color[2]);

  // Draw filled area using triangles
  for (let i = 0; i < coords.length - 1; i++) {
    const c1 = coords[i];
    const c2 = coords[i + 1];
    // Triangle 1: c1.top, c2.top, c1.bottom
    doc.setFillColor(color[0], color[1], color[2]);
    // Use a very light rectangle approximation for fill
  }

  // Draw the trend line
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.6);
  for (let i = 0; i < coords.length - 1; i++) {
    doc.line(coords[i].x, coords[i].py, coords[i + 1].x, coords[i + 1].py);
  }

  // Data points
  doc.setFillColor(color[0], color[1], color[2]);
  for (const c of coords) {
    doc.circle(c.x, c.py, 0.8, "F");
  }

  // X-axis date labels (show ~5–6 evenly spaced)
  doc.setTextColor(...GRAY);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  const labelCount = Math.min(6, points.length);
  const labelStep = Math.max(1, Math.floor((points.length - 1) / (labelCount - 1)));
  for (let i = 0; i < points.length; i += labelStep) {
    const px = chartX + i * xStep;
    doc.text(format(parseISO(points[i].date), "M/d"), px, chartBottom + 5, { align: "center" });
  }
  // Always show last date
  if ((points.length - 1) % labelStep !== 0) {
    const last = points.length - 1;
    doc.text(format(parseISO(points[last].date), "M/d"), chartX + last * xStep, chartBottom + 5, { align: "center" });
  }

  // Unit label
  doc.setTextColor(...GRAY);
  doc.setFontSize(6);
  doc.text(unitLabel, chartX + chartW + 2, chartTop + chartH / 2 + 1);

  // Average line
  const avgVal = points.reduce((s, p) => s + p.val, 0) / points.length;
  const avgY = chartBottom - (avgVal / maxVal) * chartH;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern?.([2, 2], 0);
  doc.line(chartX, avgY, chartX + chartW, avgY);
  doc.setLineDashPattern?.([], 0);
  doc.setFontSize(6);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`avg ${avgVal.toFixed(1)}`, chartX + chartW + 2, avgY + 1);

  return chartBottom + 10;
}

export function generateReportFromData(data: ReportData): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { entries, profile, medications, medLogs, appointments } = data;

  let y = addHeader(doc);

  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.text(`Report Period: ${format(parseISO(data.startDate), "MMM d, yyyy")} – ${format(parseISO(data.endDate), "MMM d, yyyy")}`, 14, y);
  y += 4;
  doc.text(`Total entries: ${entries.length}`, 14, y);
  y += 10;

  // Profile
  if (data.includeProfile && profile) {
    y = addSectionTitle(doc, "MS Profile", y);
    const profileData: string[][] = [];
    if (profile.ms_type) profileData.push(["MS Type", profile.ms_type]);
    if (profile.year_diagnosed) profileData.push(["Year Diagnosed", profile.year_diagnosed]);
    if (profile.age_range) profileData.push(["Age Range", profile.age_range]);
    if (profile.symptoms?.length) profileData.push(["Key Symptoms", profile.symptoms.join(", ")]);
    if (profile.goals?.length) profileData.push(["Goals", profile.goals.join(", ")]);

    if (profileData.length > 0) {
      autoTable(doc, {
        startY: y, head: [], body: profileData, theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: DARK },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 40, textColor: ORANGE }, 1: { cellWidth: "auto" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Symptoms
  if (data.includeSymptoms && entries.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionTitle(doc, "Symptom Summary", y);

    const symptoms = ["fatigue", "pain", "brain_fog", "mood", "mobility", "spasticity", "stress"] as const;
    const labels = ["Fatigue", "Pain", "Brain Fog", "Mood", "Mobility", "Spasticity", "Stress"];
    const summaryBody = labels.map((label, i) => {
      const vals = entries.map((e) => e[symptoms[i]]).filter((v): v is number => v !== null && v !== undefined);
      const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
      const min = vals.length ? Math.min(...vals) : "—";
      const max = vals.length ? Math.max(...vals) : "—";
      return [label, String(avg), String(min), String(max)];
    });

    autoTable(doc, {
      startY: y, head: [["Symptom", "Average", "Min", "Max"]], body: summaryBody, theme: "striped",
      headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 9, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Mood Tags Summary
    if (data.includeMoodTags) {
      const allTags = entries.flatMap((e) => e.mood_tags || []);
      if (allTags.length > 0) {
        const tagCounts: Record<string, number> = {};
        allTags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
        const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

        y = checkPageBreak(doc, y, 40);
        y = addSectionTitle(doc, "Mood Tags Frequency", y);

        const tagBody = sorted.map(([tag, count]) => {
          const pct = Math.round((count / entries.length) * 100);
          return [tag, String(count), `${pct}%`];
        });

        autoTable(doc, {
          startY: y, head: [["Mood Tag", "Times Logged", "% of Days"]], body: tagBody, theme: "striped",
          headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 9, fontStyle: "bold" },
          styles: { fontSize: 9, cellPadding: 2.5, textColor: DARK },
          alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
        y = addSubtext(doc, `${allTags.length} mood tags logged across ${entries.length} entries.`, y);
        y += 6;
      }
    }

    // Mood & Sleep Trend Charts
    if (data.includeTrendCharts && entries.length >= 3) {
      y = checkPageBreak(doc, y, 110);
      y = addSectionTitle(doc, "Symptom & Wellness Trends", y);
      y += 4;

      const FATIGUE_COLOR: [number, number, number] = [239, 68, 68]; // red
      const PAIN_COLOR: [number, number, number] = [245, 158, 11]; // amber
      const BRAINFOG_COLOR: [number, number, number] = [168, 85, 247]; // violet
      const SPASTICITY_COLOR: [number, number, number] = [236, 72, 153]; // pink
      const STRESS_COLOR: [number, number, number] = [220, 38, 38]; // deep red
      const MOBILITY_COLOR: [number, number, number] = [16, 185, 129]; // emerald
      const MOOD_COLOR: [number, number, number] = [59, 130, 246]; // blue
      const SLEEP_COLOR: [number, number, number] = [139, 92, 246]; // purple

      y = drawTrendChart(doc, entries, y, "Fatigue (0–10, lower = better)", (e) => e.fatigue, FATIGUE_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Pain (0–10, lower = better)", (e) => e.pain, PAIN_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Brain Fog (0–10, lower = better)", (e) => e.brain_fog, BRAINFOG_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Spasticity (0–10, lower = better)", (e) => e.spasticity, SPASTICITY_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Stress (0–10, lower = better)", (e) => e.stress, STRESS_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Mobility (0–10, higher = better)", (e) => e.mobility, MOBILITY_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Mood (0–10, higher = better)", (e) => e.mood, MOOD_COLOR, 10, "/10");
      y = checkPageBreak(doc, y, 55);
      y = drawTrendChart(doc, entries, y, "Sleep (hours)", (e) => e.sleep_hours, SLEEP_COLOR, 12, "hrs");
      y = checkPageBreak(doc, y, 55);

      const HYDRATION_COLOR: [number, number, number] = [6, 182, 212]; // cyan
      y = drawTrendChart(doc, entries, y, "Hydration (glasses)", (e) => e.water_glasses, HYDRATION_COLOR, 16, "gl");

      y = addSubtext(doc, "Charts show daily values with dashed average line over the report period.", y);
      y += 6;
    }

    // Period-over-Period Comparison
    if (data.includePeriodComparison && entries.length >= 2) {
      const periodDays = differenceInDays(parseISO(data.endDate), parseISO(data.startDate)) + 1;
      const priorStart = format(subDays(parseISO(data.startDate), periodDays), "yyyy-MM-dd");
      const priorEnd = format(subDays(parseISO(data.startDate), 1), "yyyy-MM-dd");

      // We only have entries in the report data, so compare first half vs second half
      const sortedAll = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const midIdx = Math.floor(sortedAll.length / 2);
      const firstHalf = sortedAll.slice(0, midIdx);
      const secondHalf = sortedAll.slice(midIdx);

      if (firstHalf.length > 0 && secondHalf.length > 0) {
        y = checkPageBreak(doc, y, 50);
        y = addSectionTitle(doc, "Period Comparison", y);

        const metrics = [
          { label: "Fatigue", key: "fatigue" as const },
          { label: "Pain", key: "pain" as const },
          { label: "Brain Fog", key: "brain_fog" as const },
          { label: "Spasticity", key: "spasticity" as const },
          { label: "Stress", key: "stress" as const },
          { label: "Mobility", key: "mobility" as const },
          { label: "Mood", key: "mood" as const },
        ];

        const compBody = metrics.map(({ label, key }) => {
          const avg1 = firstHalf.map((e) => e[key]).filter((v): v is number => v != null);
          const avg2 = secondHalf.map((e) => e[key]).filter((v): v is number => v != null);
          const a1 = avg1.length ? (avg1.reduce((a, b) => a + b, 0) / avg1.length) : null;
          const a2 = avg2.length ? (avg2.reduce((a, b) => a + b, 0) / avg2.length) : null;
          const diff = a1 != null && a2 != null ? (a2 - a1).toFixed(1) : "—";
          const arrow = a1 != null && a2 != null ? (a2 > a1 ? "↑" : a2 < a1 ? "↓" : "→") : "";
          return [label, a1 != null ? a1.toFixed(1) : "—", a2 != null ? a2.toFixed(1) : "—", `${diff} ${arrow}`];
        });

        const firstRange = `${format(parseISO(firstHalf[0].date), "M/d")}–${format(parseISO(firstHalf[firstHalf.length - 1].date), "M/d")}`;
        const secondRange = `${format(parseISO(secondHalf[0].date), "M/d")}–${format(parseISO(secondHalf[secondHalf.length - 1].date), "M/d")}`;

        autoTable(doc, {
          startY: y, head: [["Metric", `1st Half (${firstRange})`, `2nd Half (${secondRange})`, "Change"]], body: compBody, theme: "striped",
          headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
          styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK, halign: "center" },
          columnStyles: { 0: { halign: "left" } },
          alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
        y = addSubtext(doc, "Compares first half vs. second half of the report period. ↑ = increase, ↓ = decrease.", y);
        y += 6;
      }
    }

    // Daily detail
    if (entries.length > 0) {
      y = checkPageBreak(doc, y, 30);
      doc.setTextColor(...DARK); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text("Daily Log Detail", 14, y); y += 5;

      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const dailyBody = sorted.map((e) => [
        format(parseISO(e.date), "MMM d"),
        String(e.fatigue ?? "—"), String(e.pain ?? "—"), String(e.brain_fog ?? "—"),
        String(e.mood ?? "—"), String(e.mobility ?? "—"),
        String(e.spasticity ?? "—"), String(e.stress ?? "—"),
        e.sleep_hours != null ? `${e.sleep_hours}h` : "—",
      ]);

      autoTable(doc, {
        startY: y, head: [["Date", "Fatigue", "Pain", "Fog", "Mood", "Mobil.", "Spast.", "Stress", "Sleep"]], body: dailyBody, theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: DARK, halign: "center" },
        columnStyles: { 0: { halign: "left" } },
        alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Relapse Risk Score
  if (data.includeRiskScore && entries.length >= 4) {
    y = checkPageBreak(doc, y, 50);
    y = addSectionTitle(doc, "Relapse Risk Assessment", y);

    const endDate = parseISO(data.endDate);
    const recent = entries.filter((e) => {
      const d = e.date;
      const cutoff = format(subDays(endDate, 7), "yyyy-MM-dd");
      return d > cutoff && d <= data.endDate;
    });
    const older = entries.filter((e) => {
      const d = e.date;
      const cutoffRecent = format(subDays(endDate, 7), "yyyy-MM-dd");
      const cutoffOlder = format(subDays(endDate, 14), "yyyy-MM-dd");
      return d > cutoffOlder && d <= cutoffRecent;
    });

    const risk = computeRisk(recent, older);
    const weeklyScores = computeWeeklyScores(entries, endDate);

    const levelColor: Record<string, [number, number, number]> = {
      low: [34, 139, 34],
      moderate: [218, 165, 32],
      elevated: [232, 117, 26],
      high: [200, 30, 30],
    };
    const color = levelColor[risk.level] || ORANGE;
    const levelLabel = risk.level.charAt(0).toUpperCase() + risk.level.slice(1);

    autoTable(doc, {
      startY: y, head: [], body: [
        ["Risk Score", `${risk.score}/100`],
        ["Risk Level", levelLabel],
        ...(weeklyScores.length > 0 ? [["4-Week Trend", weeklyScores.map((s) => `${s}`).join(" → ")]] : []),
      ], theme: "plain",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: DARK },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40, textColor: color }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    if (risk.factors.length > 0) {
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Contributing factors:", 14, y);
      y += 5;
      for (const factor of risk.factors) {
        y = checkPageBreak(doc, y, 6);
        doc.text(`  •  ${factor}`, 14, y);
        y += 4.5;
      }
      y += 4;
    }

    y = addSubtext(doc, "Based on 7-day symptom trends vs. prior 7 days. Not a clinical assessment.", y);
    y += 6;
  }

  if (data.aiInsight) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, "AI Health Insight", y);

    const INSIGHT_BG: [number, number, number] = [255, 247, 237];
    const INSIGHT_BORDER: [number, number, number] = [253, 186, 116];
    const boxWidth = 210 - 14 * 2;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(data.aiInsight, boxWidth - 10);
    const lineHeight = 5;
    const boxHeight = wrapped.length * lineHeight + 12;

    y = checkPageBreak(doc, y, boxHeight + 8);

    doc.setFillColor(...INSIGHT_BG);
    doc.setDrawColor(...INSIGHT_BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, boxWidth, boxHeight, 3, 3, "FD");

    doc.setFillColor(...ORANGE);
    doc.rect(14, y, 3, boxHeight, "F");

    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(wrapped, 22, y + 8);

    y += boxHeight + 4;
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Generated by Lovable AI · For conversation with your neurologist only.", 14, y);
    y += 10;
  }

  // Medications
  if (data.includeMedications && medications.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, "Medication Adherence", y);

    const medBody = medications.map((med) => {
      const logs = medLogs.filter((l) => l.medication_id === med.id);
      const taken = logs.filter((l) => l.status === "taken").length;
      const skipped = logs.filter((l) => l.status === "skipped").length;
      const total = logs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
      const schedule = med.schedule_type === "daily" ? `${med.times_per_day || 1}× daily` :
        med.schedule_type === "infusion" ? `Every ${med.infusion_interval_months || 6} months` : "Custom";
      return [med.name, med.dosage || "—", schedule, `${taken}/${total}`, `${rate}%`, String(skipped)];
    });

    autoTable(doc, {
      startY: y, head: [["Medication", "Dosage", "Schedule", "Taken", "Rate", "Skipped"]], body: medBody, theme: "striped",
      headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Medication Side Effects / Related Notes
  if (data.includeMedications && entries.length > 0) {
    const medNames = medications.map((m) => m.name.toLowerCase());
    const medNotesEntries = entries.filter((e) => {
      if (!e.notes?.trim()) return false;
      const lower = e.notes.toLowerCase();
      return medNames.some((name) => lower.includes(name)) ||
        /side.?effect|reaction|nausea|dizz|headache|injection|infusion|dose/i.test(e.notes);
    });
    if (medNotesEntries.length > 0) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionTitle(doc, "Medication-Related Notes", y);

      const medNotesBody = medNotesEntries
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => [format(parseISO(e.date), "MMM d"), e.notes!]);

      autoTable(doc, {
        startY: y, head: [["Date", "Note"]], body: medNotesBody, theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
        columnStyles: { 1: { cellWidth: "auto" } },
        alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
      y = addSubtext(doc, "Notes mentioning medications or common side effects.", y);
      y += 6;
    }
  }

  // Appointments
  if (data.includeAppointments && appointments.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, "Appointments", y);

    const apptBody = [...appointments].sort((a, b) => a.date.localeCompare(b.date)).map((a) => [
      format(parseISO(a.date), "MMM d, yyyy"), a.time || "—", a.type, a.title, a.location || "—",
    ]);

    autoTable(doc, {
      startY: y, head: [["Date", "Time", "Type", "Title", "Location"]], body: apptBody, theme: "striped",
      headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Hydration
  if (data.includeHydration && entries.length > 0) {
    const hydrationEntries = entries.filter((e) => e.water_glasses != null && e.water_glasses > 0);
    if (hydrationEntries.length > 0) {
      y = checkPageBreak(doc, y, 40);
      y = addSectionTitle(doc, "Hydration Tracking", y);

      const glasses = hydrationEntries.map((e) => e.water_glasses!);
      const avg = (glasses.reduce((a, b) => a + b, 0) / glasses.length).toFixed(1);
      const min = Math.min(...glasses);
      const max = Math.max(...glasses);
      const goal = data.profile?.hydration_goal ?? 8;
      const daysMetGoal = hydrationEntries.filter((e) => e.water_glasses! >= goal).length;

      autoTable(doc, {
        startY: y, head: [], body: [
          ["Days Tracked", String(hydrationEntries.length)],
          ["Daily Goal", `${goal} glasses`],
          ["Average", `${avg} glasses`],
          ["Range", `${min}–${max} glasses`],
          ["Days Goal Met", `${daysMetGoal} / ${hydrationEntries.length} (${Math.round((daysMetGoal / hydrationEntries.length) * 100)}%)`],
        ], theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: DARK },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 40, textColor: ORANGE }, 1: { cellWidth: "auto" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Relapses
  if (data.includeRelapses && data.relapses && data.relapses.length > 0) {
    const periodRelapses = data.relapses.filter(
      (r) => r.start_date >= data.startDate && r.start_date <= data.endDate
    );
    if (periodRelapses.length > 0) {
      y = checkPageBreak(doc, y, 50);
      y = addSectionTitle(doc, "Relapse History", y);

      const sorted = [...periodRelapses].sort((a, b) => a.start_date.localeCompare(b.start_date));
      const relapseBody = sorted.map((r) => {
        const start = format(parseISO(r.start_date), "MMM d");
        const end = r.end_date ? format(parseISO(r.end_date), "MMM d") : "Ongoing";
        const duration = r.end_date
          ? `${differenceInDays(parseISO(r.end_date), parseISO(r.start_date))} days`
          : "Active";
        const severity = r.severity.charAt(0).toUpperCase() + r.severity.slice(1);
        const symptoms = r.symptoms?.slice(0, 3).join(", ") || "—";
        const treatment = r.treatment || "—";
        return [start, end, duration, severity, symptoms, treatment];
      });

      autoTable(doc, {
        startY: y,
        head: [["Start", "End", "Duration", "Severity", "Symptoms", "Treatment"]],
        body: relapseBody,
        theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 4;

      // Summary stats
      const active = periodRelapses.filter((r) => !r.is_recovered).length;
      const recovered = periodRelapses.filter((r) => r.is_recovered).length;
      y = addSubtext(doc, `Total: ${periodRelapses.length} · Recovered: ${recovered} · Active: ${active}`, y);
      y += 4;

      // Notes from relapses
      const relapseNotes = sorted.filter((r) => r.notes?.trim());
      if (relapseNotes.length > 0) {
        y = checkPageBreak(doc, y, 20);
        const notesBody = relapseNotes.map((r) => [
          format(parseISO(r.start_date), "MMM d"),
          r.notes!,
        ]);
        autoTable(doc, {
          startY: y, head: [["Date", "Relapse Notes"]], body: notesBody, theme: "striped",
          headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
          styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
          columnStyles: { 1: { cellWidth: "auto" } },
          alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    // Trigger Analysis
    if (data.includeTriggerAnalysis) {
      const allTriggers = periodRelapses.flatMap((r) => r.triggers || []);
      if (allTriggers.length > 0) {
        const triggerCounts: Record<string, number> = {};
        allTriggers.forEach((t) => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; });
        const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);

        y = checkPageBreak(doc, y, 40);
        y = addSectionTitle(doc, "Relapse Trigger Analysis", y);

        const triggerBody = sortedTriggers.map(([trigger, count]) => {
          const pct = Math.round((count / periodRelapses.length) * 100);
          return [trigger, String(count), `${pct}%`];
        });

        autoTable(doc, {
          startY: y, head: [["Trigger", "Occurrences", "% of Relapses"]], body: triggerBody, theme: "striped",
          headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 9, fontStyle: "bold" },
          styles: { fontSize: 9, cellPadding: 2.5, textColor: DARK },
          alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
        y = addSubtext(doc, `${allTriggers.length} triggers identified across ${periodRelapses.length} relapses in this period.`, y);
        y += 6;
      }
    }
  }

  // Notes
  if (data.includeNotes) {
    const notesEntries = entries.filter((e) => e.notes?.trim());
    if (notesEntries.length > 0) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionTitle(doc, "Notes & Observations", y);

      const notesBody = notesEntries.map((e) => [format(parseISO(e.date), "MMM d"), e.notes!]);

      autoTable(doc, {
        startY: y, head: [["Date", "Notes"]], body: notesBody, theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
        columnStyles: { 1: { cellWidth: "auto" } },
        alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...ORANGE);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.text("LiveWithMS · This report is for informational purposes only. Always consult your neurologist.", 105, 292, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, 196, 292, { align: "right" });
  }

  return doc.output("blob") as Blob;
}
