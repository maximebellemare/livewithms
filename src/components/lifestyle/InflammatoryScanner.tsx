import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import PremiumGate from "@/components/PremiumGate";

interface ScanFlag {
  ingredient: string;
  concern: string;
  severity: "high" | "medium" | "low";
  alternative?: string;
}

interface ScanPositive {
  ingredient: string;
  benefit: string;
}

interface ScanResult {
  overall_score: "green" | "yellow" | "red";
  overall_label: string;
  summary: string;
  flags: ScanFlag[];
  positives: ScanPositive[];
}

const scoreStyles = {
  green: { bg: "bg-green-500/10 border-green-500/25", icon: <ShieldCheck className="h-5 w-5 text-green-500" />, text: "text-green-600 dark:text-green-400" },
  yellow: { bg: "bg-amber-500/10 border-amber-500/25", icon: <ShieldAlert className="h-5 w-5 text-amber-500" />, text: "text-amber-600 dark:text-amber-400" },
  red: { bg: "bg-red-500/10 border-red-500/25", icon: <ShieldX className="h-5 w-5 text-red-500" />, text: "text-red-600 dark:text-red-400" },
};

const severityDot = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-muted-foreground" };

export default function InflammatoryScanner() {
  const { isPremium } = usePremium();
  const [mealInput, setMealInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isPremium) return <PremiumGate feature="Inflammatory Food Scanner" compact />;

  const handleScan = async () => {
    if (!mealInput.trim()) { toast.error("Enter a meal or ingredients to scan"); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("inflammatory-scanner", {
        body: { meal_name: mealInput.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to scan meal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/50 to-card p-4 border border-primary/15 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <ScanSearch className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Inflammatory Scanner</h3>
            <p className="text-[11px] text-muted-foreground">Check if a meal may trigger inflammation</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input type="text" value={mealInput} onChange={e => setMealInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleScan()}
            placeholder="e.g. Grilled chicken with pasta and cheese sauce"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={200} />
          <button onClick={handleScan} disabled={isLoading || !mealInput.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Overall score */}
            <div className={`rounded-xl border p-4 ${scoreStyles[result.overall_score].bg}`}>
              <div className="flex items-center gap-3">
                {scoreStyles[result.overall_score].icon}
                <div>
                  <p className={`text-sm font-semibold ${scoreStyles[result.overall_score].text}`}>{result.overall_label}</p>
                  <p className="text-xs text-foreground/80 mt-0.5">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Flags */}
            {result.flags?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">⚠️ Inflammatory Flags</p>
                {result.flags.map((flag, i) => (
                  <div key={i} className="rounded-lg bg-card border border-border p-3 shadow-soft">
                    <div className="flex items-start gap-2">
                      <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot[flag.severity]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{flag.ingredient}</p>
                        <p className="text-xs text-muted-foreground">{flag.concern}</p>
                        {flag.alternative && (
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" /> Try: {flag.alternative}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Positives */}
            {result.positives?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">✅ Anti-inflammatory Benefits</p>
                {result.positives.map((pos, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-green-500/5 border border-green-500/15 p-3">
                    <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{pos.ingredient}</p>
                      <p className="text-xs text-muted-foreground">{pos.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
