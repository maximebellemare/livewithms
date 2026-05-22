import { useState } from "react";
import { Stethoscope, Crown, Download, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEntries } from "@/hooks/useEntries";
import { useRelapses } from "@/hooks/useRelapses";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { useProfile } from "@/hooks/useProfile";
import { format, subDays } from "date-fns";
import PremiumGate from "@/components/PremiumGate";
import { generateReportFromData } from "@/lib/report-generator-db";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

const DoctorMode = () => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { data: entries = [] } = useEntries();
  const { data: relapses = [] } = useRelapses();
  const { data: meds = [] } = useDbMedications();
  const { data: medLogs = [] } = useDbMedicationLogs();
  const { data: profile } = useProfile();

  const ninetyDaysAgo = format(subDays(new Date(), 89), "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const recent = entries.filter((e) => e.date >= ninetyDaysAgo);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("monthly-health-review", {
        body: {
          entries: recent,
          relapses: relapses.filter((r) => r.start_date >= ninetyDaysAgo),
          medications: meds.map((m) => m.name),
          msType: profile?.ms_type,
          mode: "doctor",
        },
      });
      if (error) throw error;
      setSummary(data.review ?? null);
    } catch {
      toast({ title: "Error", description: "Failed to generate clinical summary.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setGenerating(true);
    try {
      const filteredLogs = (medLogs || []).filter((log) => log.date >= ninetyDaysAgo);
      const blob = await generateReportFromData({
        startDate: ninetyDaysAgo,
        endDate: todayStr,
        includeSymptoms: true,
        includeMedications: true,
        includeAppointments: false,
        includeProfile: true,
        includeNotes: true,
        includeRelapses: true,
        includeHydration: true,
        includeRiskScore: true,
        includeTrendCharts: true,
        includeMoodTags: true,
        includePeriodComparison: true,
        includeTriggerAnalysis: true,
        aiInsight: summary,
        entries: recent,
        profile: profile || null,
        medications: meds,
        medLogs: filteredLogs,
        appointments: [],
        relapses: relapses.filter((r) => r.start_date >= ninetyDaysAgo),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LiveWithMS-Clinical-Report-${format(new Date(), "yyyy-MM-dd")}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Report downloaded", description: "Your 90-day clinical report is ready." });
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PremiumGate feature="Doctor Mode — Clinical Prep Suite">
      <div className="rounded-xl bg-card p-5 shadow-soft border border-primary/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Stethoscope className="h-4 w-4 text-primary" />
          </span>
          <div>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Doctor Mode
              <Crown className="h-3 w-3 text-primary" />
            </span>
            <p className="text-[10px] text-muted-foreground">90-day clinical summary for appointments</p>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/50 px-4 py-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Period</span>
            <span className="font-medium text-foreground">{format(subDays(new Date(), 89), "MMM d")} — {format(new Date(), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Entries logged</span>
            <span className="font-medium text-foreground">{recent.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Medications</span>
            <span className="font-medium text-foreground">{meds.filter((m) => m.active).length} active</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Relapses (90d)</span>
            <span className="font-medium text-foreground">{relapses.filter((r) => r.start_date >= ninetyDaysAgo).length}</span>
          </div>
        </div>

        {summary ? (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Summary for Neurologist
            </p>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{summary}</p>
          </div>
        ) : (
          <button
            onClick={generateSummary}
            disabled={loading || recent.length < 3}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-60"
          >
            {loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4 text-primary" /> Generate AI Clinical Summary</>
            )}
          </button>
        )}

        <button
          onClick={handleExportPdf}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {generating ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Preparing report…</>
          ) : (
            <><Download className="h-4 w-4" /> Export 90-Day Clinical Report</>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          Optimized for medical appointments. Print or share with your neurologist.
        </p>
      </div>
    </PremiumGate>
  );
};

export default DoctorMode;
