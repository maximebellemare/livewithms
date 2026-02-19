import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns";
import { getMedications, getMedicationLogs, getAdherenceRate } from "./medications";
import { getAppointments, getAppointmentTypeInfo } from "./appointments";

interface ReportOptions {
  startDate: string;
  endDate: string;
  includeSymptoms: boolean;
  includeMedications: boolean;
  includeAppointments: boolean;
  includeProfile: boolean;
  includeNotes: boolean;
}

// Brand colors
const ORANGE: [number, number, number] = [232, 117, 26];
const DARK: [number, number, number] = [31, 31, 31];
const GRAY: [number, number, number] = [120, 120, 120];
const LIGHT_BG: [number, number, number] = [252, 249, 246];
const WHITE: [number, number, number] = [255, 255, 255];

const getEntries = () => JSON.parse(localStorage.getItem("ms-entries") || "[]");
const getProfile = () => JSON.parse(localStorage.getItem("ms-profile") || "{}");

function addHeader(doc: jsPDF, y: number): number {
  // Orange header bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("LiveWithMS", 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Doctor-Ready Health Report", 14, 21);

  // Date on right
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 196, 14, { align: "right" });
  doc.text("⚕️ Not medical advice", 196, 21, { align: "right" });

  return 34;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
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
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateReport(options: ReportOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const entries = getEntries().filter(
    (e: any) => e.date >= options.startDate && e.date <= options.endDate
  );
  const profile = getProfile();
  const medications = getMedications();
  const medLogs = getMedicationLogs().filter(
    (l) => l.date >= options.startDate && l.date <= options.endDate
  );
  const appointments = getAppointments().filter(
    (a) => a.date >= options.startDate && a.date <= options.endDate
  );

  let y = addHeader(doc, 0);

  // Report period
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.text(
    `Report Period: ${format(parseISO(options.startDate), "MMM d, yyyy")} – ${format(parseISO(options.endDate), "MMM d, yyyy")}`,
    14, y
  );
  y += 4;
  doc.text(`Total entries: ${entries.length}`, 14, y);
  y += 10;

  // ---- MS Profile ----
  if (options.includeProfile && Object.keys(profile).length > 0) {
    y = addSectionTitle(doc, "MS Profile", y);
    const profileData: string[][] = [];
    if (profile.msType) profileData.push(["MS Type", profile.msType]);
    if (profile.yearDiagnosed) profileData.push(["Year Diagnosed", profile.yearDiagnosed]);
    if (profile.ageRange) profileData.push(["Age Range", profile.ageRange]);
    if (profile.symptoms?.length) profileData.push(["Key Symptoms", profile.symptoms.join(", ")]);
    if (profile.goals?.length) profileData.push(["Goals", profile.goals.join(", ")]);
    if (profile.medications?.length) profileData.push(["Onboarding Meds", profile.medications.join(", ")]);

    if (profileData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [],
        body: profileData,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: DARK },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40, textColor: ORANGE },
          1: { cellWidth: "auto" },
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ---- Symptom Summary ----
  if (options.includeSymptoms && entries.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionTitle(doc, "Symptom Summary", y);

    // Compute averages
    const symptoms = ["fatigue", "pain", "brainFog", "mood", "mobility", "spasticity", "stress"];
    const labels = ["Fatigue", "Pain", "Brain Fog", "Mood", "Mobility", "Spasticity", "Stress"];
    const avgs = symptoms.map((s) => {
      const vals = entries.map((e: any) => e[s]).filter((v: any) => v !== undefined && v !== null);
      if (vals.length === 0) return null;
      return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1);
    });

    // Summary table
    const summaryBody = labels.map((label, i) => {
      const vals = entries.map((e: any) => e[symptoms[i]]).filter((v: any) => v !== undefined);
      const avg = avgs[i] || "—";
      const min = vals.length ? Math.min(...vals) : "—";
      const max = vals.length ? Math.max(...vals) : "—";
      return [label, String(avg), String(min), String(max)];
    });

    autoTable(doc, {
      startY: y,
      head: [["Symptom", "Average", "Min", "Max"]],
      body: summaryBody,
      theme: "striped",
      headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 9, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Best/Worst days
    if (entries.length >= 2) {
      y = checkPageBreak(doc, y, 20);
      const entryScores = entries.map((e: any) => ({
        date: e.date,
        score: (e.fatigue || 0) + (e.pain || 0) + (e.brainFog || 0) + (10 - (e.mood || 0)) + (e.spasticity || 0) + (e.stress || 0),
      }));
      entryScores.sort((a: any, b: any) => a.score - b.score);
      const best = entryScores[0];
      const worst = entryScores[entryScores.length - 1];

      y = addSubtext(doc, `Best day: ${format(parseISO(best.date), "MMM d")} (lowest combined severity)`, y);
      y = addSubtext(doc, `Most challenging day: ${format(parseISO(worst.date), "MMM d")} (highest combined severity)`, y);
      y += 4;
    }

    // Daily detail table
    if (entries.length > 0) {
      y = checkPageBreak(doc, y, 30);
      doc.setTextColor(...DARK);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Log Detail", 14, y);
      y += 5;

      const dailyBody = entries
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .map((e: any) => [
          format(parseISO(e.date), "MMM d"),
          String(e.fatigue ?? "—"),
          String(e.pain ?? "—"),
          String(e.brainFog ?? "—"),
          String(e.mood ?? "—"),
          String(e.mobility ?? "—"),
          String(e.spasticity ?? "—"),
          String(e.stress ?? "—"),
          e.sleepHours != null ? `${e.sleepHours}h` : "—",
        ]);

      autoTable(doc, {
        startY: y,
        head: [["Date", "Fatigue", "Pain", "Fog", "Mood", "Mobil.", "Spast.", "Stress", "Sleep"]],
        body: dailyBody,
        theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: DARK, halign: "center" },
        columnStyles: { 0: { halign: "left" } },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ---- Medication Adherence ----
  if (options.includeMedications && medications.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, "Medication Adherence", y);

    const medBody = medications.map((med) => {
      const logs = medLogs.filter((l) => l.medicationId === med.id);
      const taken = logs.filter((l) => l.status === "taken").length;
      const skipped = logs.filter((l) => l.status === "skipped").length;
      const total = logs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
      const schedule =
        med.scheduleType === "daily" ? `${med.timesPerDay || 1}× daily` :
        med.scheduleType === "infusion" ? `Every ${med.infusionIntervalMonths || 6} months` :
        "Custom schedule";

      return [
        med.name,
        med.dosage || "—",
        schedule,
        `${taken}/${total}`,
        `${rate}%`,
        String(skipped),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Medication", "Dosage", "Schedule", "Taken", "Rate", "Skipped"]],
      body: medBody,
      theme: "striped",
      headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ---- Appointments ----
  if (options.includeAppointments && appointments.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, "Appointments", y);

    const apptBody = appointments
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((a) => {
        const typeInfo = getAppointmentTypeInfo(a.type);
        return [
          format(parseISO(a.date), "MMM d, yyyy"),
          a.time || "—",
          typeInfo.label,
          a.title,
          a.location || "—",
        ];
      });

    autoTable(doc, {
      startY: y,
      head: [["Date", "Time", "Type", "Title", "Location"]],
      body: apptBody,
      theme: "striped",
      headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ---- Notes highlights ----
  if (options.includeNotes) {
    const notesEntries = entries.filter((e: any) => e.notes?.trim());
    if (notesEntries.length > 0) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionTitle(doc, "Notes & Observations", y);

      const notesBody = notesEntries.map((e: any) => [
        format(parseISO(e.date), "MMM d"),
        e.notes,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Date", "Notes"]],
        body: notesBody,
        theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
        columnStyles: { 1: { cellWidth: "auto" } },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ---- Footer ----
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

  // Save
  const filename = `LiveWithMS-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
}
