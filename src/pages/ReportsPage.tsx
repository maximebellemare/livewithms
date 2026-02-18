import { useState } from "react";
import { format, subDays } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { FileText, Download, Calendar as CalendarIcon, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { useEntriesInRange } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { useDbAppointments } from "@/hooks/useAppointments";
import { generateReportFromData } from "@/lib/report-generator-db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

const ReportsPage = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(subDays(today, 30));
  const [endDate, setEndDate] = useState<Date>(today);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeAiInsight, setIncludeAiInsight] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  const reportFileName = `LiveWithMS-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const { data: entries = [] } = useEntriesInRange(startStr, endStr);
  const { data: profile } = useProfile();
  const { data: medications = [] } = useDbMedications();
  const { data: medLogs = [] } = useDbMedicationLogs(startStr, endStr);
  const { data: appointments = [] } = useDbAppointments();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let aiInsight: string | null = null;

      if (includeAiInsight && entries.length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke("weekly-insight", {
            body: { entries, range: entries.length },
          });
          if (!error && data?.insight) aiInsight = data.insight;
        } catch {
          // Non-fatal — generate without insight if it fails
        }
      }

      const filteredAppts = appointments.filter((a) => a.date >= startStr && a.date <= endStr);
      const blob = generateReportFromData({
        startDate: startStr,
        endDate: endStr,
        includeSymptoms,
        includeMedications,
        includeAppointments,
        includeProfile,
        includeNotes,
        aiInsight,
        entries,
        profile: profile || null,
        medications,
        medLogs,
        appointments: filteredAppts,
      });
      setReportBlob(blob);
      // Auto-download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Failed to generate report: " + err.message);
    } finally {
      setGenerating(false);
    }
  };


  const applyPreset = (days: number) => {
    setStartDate(subDays(today, days));
    setEndDate(today);
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Doctor-ready summaries" action={
        <Link to="/profile" className="rounded-full p-2 text-muted-foreground hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></Link>
      } />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4 pb-24 animate-fade-in">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent p-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">Doctor-Ready Report</h2>
          <p className="mt-1 text-xs text-muted-foreground">Generate a professional PDF summary of your health data to share with your neurologist.</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick select</p>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button key={p.days} onClick={() => applyPreset(p.days)} className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${Math.round((endDate.getTime() - startDate.getTime()) / 86400000) === p.days ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <p className="text-sm font-medium text-foreground">Date Range</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">From</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left text-xs">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />{format(startDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">To</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left text-xs">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />{format(endDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <p className="text-sm font-medium text-foreground">Include in report</p>
          {[
            { label: "MS Profile Overview", checked: includeProfile, toggle: setIncludeProfile, emoji: "🧡" },
            { label: "Symptom Charts & Averages", checked: includeSymptoms, toggle: setIncludeSymptoms, emoji: "📊" },
            { label: "Medication Adherence", checked: includeMedications, toggle: setIncludeMedications, emoji: "💊" },
            { label: "Appointment History", checked: includeAppointments, toggle: setIncludeAppointments, emoji: "📅" },
            { label: "Notes & Observations", checked: includeNotes, toggle: setIncludeNotes, emoji: "📝" },
            { label: "AI Weekly Insight", checked: includeAiInsight, toggle: setIncludeAiInsight, emoji: "✨" },
          ].map(({ label, checked, toggle, emoji }) => (
            <button key={label} onClick={() => toggle(!checked)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-secondary/50">
              <span className="text-base">{emoji}</span>
              <span className="flex-1 text-sm text-foreground">{label}</span>
              <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"}`}>
                {checked && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
            </button>
          ))}

        </div>

        <div className="space-y-3">
          <button onClick={handleGenerate} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
            {generating ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />{includeAiInsight ? "Generating AI insight…" : "Generating…"}</>) : (<><Download className="h-5 w-5" />Generate PDF Report</>)}
          </button>
          {reportBlob && (
            <div className="rounded-xl bg-accent p-4 animate-fade-in space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-accent-foreground">✅ Report ready!</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Download or share directly with your neurologist.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(reportBlob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = reportFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 bg-background py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={async () => {
                    const file = new File([reportBlob], reportFileName, { type: "application/pdf" });
                    const neuroEmail = profile?.neurologist_email ?? "";
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({
                          files: [file],
                          title: "My MS Health Report",
                          text: "Please find my LiveWithMS health report attached for our upcoming appointment.",
                        });
                      } catch {
                        // User cancelled — no-op
                      }
                    } else {
                      // Fallback: mailto with pre-filled recipient if saved
                      const to = neuroEmail ? encodeURIComponent(neuroEmail) : "";
                      const subject = encodeURIComponent("My MS Health Report");
                      const body = encodeURIComponent("Hi,\n\nPlease find my LiveWithMS health report attached.\n\nThe PDF was downloaded to your device — please attach it to this email before sending.\n\nThank you.");
                      window.open(`mailto:${to}?subject=${subject}&body=${body}`);
                      toast.info(neuroEmail ? `Email draft opened for ${neuroEmail} — attach the PDF before sending.` : "PDF saved — attach it to the email that opened.");
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <Share2 className="h-4 w-4" />
                  {profile?.neurologist_email ? "Email Neurologist" : "Share"}
                </button>
              </div>
            </div>
          )}
          <p className="text-center text-[10px] text-muted-foreground">⚕️ This report is for informational purposes only. Always consult your neurologist for medical decisions.</p>
        </div>
      </div>
    </>
  );
};

export default ReportsPage;
