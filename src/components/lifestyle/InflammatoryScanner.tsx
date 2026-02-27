import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, Loader2, ShieldCheck, ShieldAlert, ShieldX, ArrowRight, Ban, UtensilsCrossed, Camera, History, Trash2, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMealLogs } from "@/hooks/useMealLogs";
import { useInflammatoryScanHistory, useSaveInflammatoryScan, useDeleteInflammatoryScan } from "@/hooks/useInflammatoryScanHistory";
import PremiumGate from "@/components/PremiumGate";
import InflammationWeeklyReport from "./InflammationWeeklyReport";
import IngredientAlternatives from "./IngredientAlternatives";

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
  personalized_note?: string | null;
  flags: ScanFlag[];
  positives: ScanPositive[];
}

const scoreStyles = {
  green: { bg: "bg-green-500/10 border-green-500/25", icon: <ShieldCheck className="h-5 w-5 text-green-500" />, text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  yellow: { bg: "bg-amber-500/10 border-amber-500/25", icon: <ShieldAlert className="h-5 w-5 text-amber-500" />, text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  red: { bg: "bg-red-500/10 border-red-500/25", icon: <ShieldX className="h-5 w-5 text-red-500" />, text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

const severityDot = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-muted-foreground" };

export default function InflammatoryScanner() {
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: mealLogs = [] } = useMealLogs(50);
  const { data: scanHistory = [] } = useInflammatoryScanHistory(20);
  const saveScan = useSaveInflammatoryScan();
  const deleteScan = useDeleteInflammatoryScan();
  const [mealInput, setMealInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [excludingIngredient, setExcludingIngredient] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isPremium) return <PremiumGate feature="Inflammatory Food Scanner" compact />;

  const handleScan = async (meal?: string) => {
    const input = meal || mealInput.trim();
    if (!input) { toast.error("Enter a meal or ingredients to scan"); return; }
    if (meal) setMealInput(input);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("inflammatory-scanner", {
        body: {
          meal_name: input,
          ms_type: profile?.ms_type || null,
          symptoms: profile?.symptoms || [],
          medications: profile?.medications || [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      // Save to history
      saveScan.mutate({
        meal_name: input,
        overall_score: data.overall_score,
        overall_label: data.overall_label,
        summary: data.summary || null,
        flags: data.flags || [],
        positives: data.positives || [],
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to scan meal");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCapturing(true);
    try {
      // Convert to base64 data URL
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send image directly to vision AI for identification + analysis
      const { data, error } = await supabase.functions.invoke("inflammatory-scanner", {
        body: {
          image_base64: base64,
          ms_type: profile?.ms_type || null,
          symptoms: profile?.symptoms || [],
          medications: profile?.medications || [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const mealName = data.identified_meal || "Photo scan";
      setMealInput(mealName);
      setResult(data);
      // Save to history
      saveScan.mutate({
        meal_name: mealName,
        overall_score: data.overall_score,
        overall_label: data.overall_label,
        summary: data.summary || null,
        flags: data.flags || [],
        positives: data.positives || [],
      });
      toast.success(`📸 Identified: ${mealName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process photo");
    } finally {
      setIsCapturing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExclude = async (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    const current = profile?.excluded_ingredients ?? [];
    if (current.some(i => i.toLowerCase() === trimmed)) {
      toast.info(`"${trimmed}" is already excluded`);
      return;
    }
    setExcludingIngredient(trimmed);
    try {
      const { error } = await supabase.from("profiles").update({ excluded_ingredients: [...current, trimmed] }).eq("user_id", user!.id);
      if (error) throw error;
      toast.success(`"${trimmed}" excluded from future AI meal plans`);
    } catch {
      toast.error("Failed to exclude ingredient");
    } finally {
      setExcludingIngredient(null);
    }
  };

  const loadFromHistory = (scan: typeof scanHistory[0]) => {
    setResult({
      overall_score: scan.overall_score as "green" | "yellow" | "red",
      overall_label: scan.overall_label,
      summary: scan.summary || "",
      flags: scan.flags || [],
      positives: scan.positives || [],
    });
    setMealInput(scan.meal_name);
    setShowHistory(false);
  };

  // Deduplicate recent meals for quick-scan chips
  const recentMeals = Array.from(new Set(mealLogs.map(l => l.name))).slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/50 to-card p-4 border border-primary/15 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <ScanSearch className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Inflammatory Scanner</h3>
            <p className="text-[11px] text-muted-foreground">Personalized for your MS profile</p>
          </div>
          {scanHistory.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              <History className="h-3 w-3" />
              {scanHistory.length}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input type="text" value={mealInput} onChange={e => setMealInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleScan()}
            placeholder="e.g. Grilled chicken with pasta and cheese sauce"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={200} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || isCapturing}
            className="rounded-lg border border-border bg-background px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
            title="Scan from photo">
            {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <button onClick={() => handleScan()} disabled={isLoading || !mealInput.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />

        {/* Personalized badge */}
        {profile?.ms_type && (
          <p className="mt-2 text-[10px] text-primary/70 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Tailored for {profile.ms_type} · {(profile.symptoms ?? []).length} symptoms tracked
          </p>
        )}

        {/* Quick-scan chips from recent meals */}
        {recentMeals.length > 0 && (
          <div className="mt-2.5 space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <UtensilsCrossed className="h-2.5 w-2.5" /> Quick scan from diary:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recentMeals.map((meal) => (
                <button
                  key={meal}
                  onClick={() => handleScan(meal)}
                  disabled={isLoading}
                  className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-primary/15 hover:text-primary active:scale-95 transition-all disabled:opacity-50"
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scan History */}
      <AnimatePresence>
        {showHistory && scanHistory.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-card border border-border p-3 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">📋 Scan History</p>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {scanHistory.map(scan => {
                  const style = scoreStyles[scan.overall_score as keyof typeof scoreStyles] || scoreStyles.yellow;
                  return (
                    <div key={scan.id} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 hover:bg-secondary transition-colors">
                      <button onClick={() => loadFromHistory(scan)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${style.dot}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{scan.meal_name}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(scan.scanned_at), "MMM d, h:mm a")}</p>
                        </div>
                      </button>
                      <button onClick={() => deleteScan.mutate(scan.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {result.personalized_note && (
                    <p className="text-[11px] text-primary/80 mt-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 flex-shrink-0" />
                      <span className="italic">{result.personalized_note}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Flags */}
            {result.flags?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">⚠️ Inflammatory Flags</p>
                {result.flags.map((flag, i) => {
                  const alreadyExcluded = (profile?.excluded_ingredients ?? []).some(
                    ing => ing.toLowerCase() === flag.ingredient.toLowerCase()
                  );
                  return (
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
                          <button
                            onClick={() => handleExclude(flag.ingredient)}
                            disabled={alreadyExcluded || excludingIngredient === flag.ingredient.toLowerCase()}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-all"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            {alreadyExcluded ? "Already excluded" : "Exclude from future plans"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
      {/* Weekly Report — only counts meals from your diary */}
      {scanHistory.length >= 2 && (
        <InflammationWeeklyReport scans={scanHistory} mealLogNames={mealLogs.map(m => m.name)} />
      )}

      {/* Ingredient Alternatives Library */}
      <IngredientAlternatives />
    </div>
  );
}
