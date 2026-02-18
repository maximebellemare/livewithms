import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import type { DailyEntry } from "@/hooks/useEntries";
import type { Profile } from "@/hooks/useProfile";
import type { DbMedication, DbMedicationLog } from "@/hooks/useMedications";
import type { DbAppointment } from "@/hooks/useAppointments";

interface ReportData {
  startDate: string;
  endDate: string;
  includeSymptoms: boolean;
  includeMedications: boolean;
  includeAppointments: boolean;
  includeProfile: boolean;
  includeNotes: boolean;
  entries: DailyEntry[];
  profile: Profile | null;
  medications: DbMedication[];
  medLogs: DbMedicationLog[];
  appointments: DbAppointment[];
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

export function generateReportFromData(data: ReportData): void {
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

    const symptoms = ["fatigue", "pain", "brain_fog", "mood", "mobility"] as const;
    const labels = ["Fatigue", "Pain", "Brain Fog", "Mood", "Mobility"];
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
        e.sleep_hours != null ? `${e.sleep_hours}h` : "—",
      ]);

      autoTable(doc, {
        startY: y, head: [["Date", "Fatigue", "Pain", "Fog", "Mood", "Mobility", "Sleep"]], body: dailyBody, theme: "striped",
        headStyles: { fillColor: ORANGE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: DARK, halign: "center" },
        columnStyles: { 0: { halign: "left" } },
        alternateRowStyles: { fillColor: LIGHT_BG }, margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
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

  doc.save(`LiveWithMS-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
