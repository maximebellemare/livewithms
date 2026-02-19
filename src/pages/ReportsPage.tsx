import { useState } from "react";
import { format, subDays } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { FileText, Download, Calendar as CalendarIcon, ArrowLeft, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useEntriesInRange } from "@/hooks/useEntries";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
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

/** Convert a Blob to a base64 string (strips the data-URI prefix) */
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

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
  const [sending, setSending] = useState(false);
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const reportFileName = `LiveWithMS-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const { data: entries = [] } = useEntriesInRange(startStr, endStr);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: medications = [] } = useDbMedications();
  const { data: medLogs = [] } = useDbMedicationLogs(startStr, endStr);
  const { data: appointments = [] } = useDbAppointments();

  /** Build the report blob (shared by generate + send flows) */
  const buildBlob = async (): Promise<Blob> => {
    let aiInsight: string | null = null;
    if (includeAiInsight && entries.length > 0) {
      try {
        const { data, error } = await supabase.functions.invoke("weekly-insight", {
          body: { entries, range: entries.length },
        });
        if (!error && data?.insight) aiInsight = data.insight;
      } catch { /* non-fatal */ }
    }
    const filteredAppts = appointments.filter((a) => a.date >= startStr && a.date <= endStr);
    return generateReportFromData({
      startDate: startStr, endDate: endStr,
      includeSymptoms, includeMedications, includeAppointments,
      includeProfile, includeNotes, aiInsight,
      entries, profile: profile || null,
      medications, medLogs, appointments: filteredAppts,
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await buildBlob();
      setReportBlob(blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = reportFileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Failed to generate report: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToNeurologist = () => {
    if (!profile?.neurologist_email) {
      toast.error("No neurologist email saved — add one in your Profile settings.");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSend = async () => {
    setShowConfirmDialog(false);
    setSending(true);
    try {
      // Reuse existing blob or generate a fresh one
      const blob = reportBlob ?? await buildBlob();
      if (!reportBlob) setReportBlob(blob);

      const pdfBase64 = await blobToBase64(blob);
      const period = `${format(startDate, "MMM d")}–${format(endDate, "MMM d, yyyy")}`;

      const { data, error } = await supabase.functions.invoke("send-report", {
        body: {
          recipientEmail: profile!.neurologist_email,
          pdfBase64,
          fileName: reportFileName,
          reportPeriod: period,
        },
      });

      if (error || data?.error) {
        // Graceful fallback: download + open mailto
        console.error("send-report error:", error ?? data?.error);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = reportFileName; a.click();
        URL.revokeObjectURL(url);
        const to = encodeURIComponent(profile!.neurologist_email!);
        const subject = encodeURIComponent(`MS Health Report – ${period}`);
        const body = encodeURIComponent(
          `Hi,\n\nPlease find my LiveWithMS health report for ${period} attached.\n\nThe PDF was saved to my device — I'll attach it to this email.\n\nThank you.`
        );
        window.open(`mailto:${to}?subject=${subject}&body=${body}`);
        toast.info(`Email draft opened for ${profile!.neurologist_email} — please attach the downloaded PDF.`);
      } else {
        toast.success(`Report emailed to ${profile!.neurologist_email} — your neurologist will receive a download link ✓`);
        // Record the send timestamp
        await updateProfile.mutateAsync({ last_report_sent_at: new Date().toISOString() } as any);
      }
    } catch (err: any) {
      toast.error("Failed to send: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const applyPreset = (days: number) => {
    setStartDate(subDays(today, days));
    setEndDate(today);
  };

  const neuroEmail = profile?.neurologist_email;
  const neuroName = profile?.neurologist_name;

  const period = `${format(startDate, "MMM d")}–${format(endDate, "MMM d, yyyy")}`;

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send report to {neuroName || "neurologist"}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                  <div className="rounded-lg bg-muted px-4 py-3 space-y-2 text-sm">
                    {neuroName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Neurologist</span>
                        <span className="font-medium text-foreground">{neuroName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipient</span>
                      <span className="font-medium text-foreground">{neuroEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Report period</span>
                      <span className="font-medium text-foreground">{period}</span>
                    </div>
                  </div>
                <p className="text-xs text-muted-foreground">
                  Your neurologist will receive an email with a secure link to download the PDF report.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend} className="bg-primary text-primary-foreground hover:opacity-90">
              <Send className="mr-2 h-4 w-4" />
              Send Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {neuroEmail && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              📧 Will send to <span className="font-medium text-foreground">{neuroEmail}</span>
            </p>
          )}
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
          {/* Primary generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || sending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {generating
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />{includeAiInsight ? "Generating AI insight…" : "Generating…"}</>
              : <><Download className="h-5 w-5" />Generate PDF Report</>
            }
          </button>

          {/* Send to neurologist — always visible if email is saved */}
          {neuroEmail && (
            <button
              onClick={handleSendToNeurologist}
              disabled={generating || sending}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-background py-3.5 text-base font-semibold text-primary transition-all hover:bg-primary/5 active:scale-[0.98] disabled:opacity-60"
            >
              {sending
                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Sending…</>
                : <><Send className="h-5 w-5" />Send to Neurologist</>
              }
            </button>
          )}

          {!neuroEmail && (
            <p className="text-center text-xs text-muted-foreground">
              💡 <Link to="/profile" className="underline underline-offset-2 hover:text-foreground">Add your neurologist's email</Link> to enable direct sending.
            </p>
          )}

          {/* Last sent timestamp */}
          {neuroEmail && profile?.last_report_sent_at && (
            <p className="text-center text-xs text-muted-foreground animate-fade-in">
              📨 Last sent to {neuroName || "your neurologist"} on{" "}
              <span className="font-medium text-foreground">
                {format(new Date(profile.last_report_sent_at), "MMM d, yyyy")}
              </span>
            </p>
          )}

          {/* Post-generate actions */}
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
                    a.href = url; a.download = reportFileName; a.click();
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
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({ files: [file], title: "My MS Health Report", text: "Please find my LiveWithMS health report attached." });
                      } catch { /* cancelled */ }
                    } else {
                      const to = neuroEmail ? encodeURIComponent(neuroEmail) : "";
                      const subject = encodeURIComponent("My MS Health Report");
                      const body = encodeURIComponent("Hi,\n\nPlease find my LiveWithMS health report attached.\n\nThe PDF was downloaded — please attach it before sending.\n\nThank you.");
                      window.open(`mailto:${to}?subject=${subject}&body=${body}`);
                      toast.info(neuroEmail ? `Email draft opened for ${neuroEmail} — attach the PDF before sending.` : "PDF saved — attach it to the email that opened.");
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <Share2 className="h-4 w-4" />
                  {neuroEmail ? "Share" : "Share"}
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
