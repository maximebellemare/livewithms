import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import confetti from "canvas-confetti";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import SEOHead from "@/components/SEOHead";
import DigestPreviewCard from "@/components/DigestPreviewCard";
import PageHeader from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, Download, Shield, ExternalLink, FileText, LogOut, Moon, Sun, Mail, Check, Mails, Sparkles, Users, BellRing, Bell, Trash2, AlertTriangle, Globe, Calendar, Activity, Target, Stethoscope, Monitor, RotateCcw, Snowflake, MessageSquare, Thermometer, Droplets, X } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import NotificationToggle from "@/components/NotificationToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useEntries, useEntriesInRange } from "@/hooks/useEntries";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { useRelapses } from "@/hooks/useRelapses";
import { useWeekStreak } from "@/hooks/useWeekStreak";
import { format, startOfWeek } from "date-fns";
import { AvatarUpload } from "@/components/community/AvatarUpload";
import { useBadgeEvents } from "@/hooks/useBadgeEvents";
import { useUnreadMessagesCount } from "@/hooks/useMessages";

function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntil = (8 - day) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntil);
  const weekday = next.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${weekday} ${monthDay}`;
}

function getWeeklyMotivation(daysLogged: number, goal: number): string {
  if (daysLogged === 0) return "Log today to start your week strong 💪";
  if (daysLogged < goal * 0.5) return `${daysLogged} day${daysLogged > 1 ? "s" : ""} logged — keep going! ⚡`;
  if (daysLogged < goal) return `${daysLogged}/${goal} days — almost there! 🎉`;
  return `Goal reached — ${daysLogged}/${goal} days logged! 🔥`;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === "dark";

  // This week's entries (Monday → today)
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(new Date(), "yyyy-MM-dd");
  const { data: weekEntries } = useEntriesInRange(weekStart, weekEnd);
  const daysLoggedThisWeek = weekEntries?.length ?? 0;

  // Consecutive-week streak — shared hook
  const { weekStreak } = useWeekStreak();
  const { data: badgeEvents = [] } = useBadgeEvents();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
  const allBadgesEarned = badgeEvents.length >= 15;

  const [neuroEmail, setNeuroEmail] = useState<string>("");
  const [neuroName, setNeuroName] = useState<string>("");
  const [neuroEmailInit, setNeuroEmailInit] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [togglingDigest, setTogglingDigest] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInit, setDisplayNameInit] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [country, setCountry] = useState("");
  const [countryInit, setCountryInit] = useState(false);
  const [savingCountry, setSavingCountry] = useState(false);
  const [city, setCity] = useState("");
  const [cityInit, setCityInit] = useState(false);
  const [savingCity, setSavingCity] = useState(false);
  const [ageRange, setAgeRange] = useState("");
  const [ageRangeInit, setAgeRangeInit] = useState(false);
  const [savingAgeRange, setSavingAgeRange] = useState(false);
  const [msType, setMsType] = useState("");
  const [msTypeInit, setMsTypeInit] = useState(false);
  const [savingMsType, setSavingMsType] = useState(false);
  const [yearDiagnosed, setYearDiagnosed] = useState("");
  const [yearDiagnosedInit, setYearDiagnosedInit] = useState(false);
  const [savingYearDiagnosed, setSavingYearDiagnosed] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomsInit, setSymptomsInit] = useState(false);
  const [savingSymptoms, setSavingSymptoms] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [goalsInit, setGoalsInit] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [sendingTestDigest, setSendingTestDigest] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState<string | null>(null);

  // Data for individual CSV exports
  const { data: allEntries } = useEntries();
  const { data: allMedications } = useDbMedications();
  const { data: allMedLogs } = useDbMedicationLogs();
  const { data: allRelapses } = useRelapses();

  const downloadCsv = useCallback((rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((h) => {
        const v = row[h];
        const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join("; ") : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded`);
  }, []);

  const handleExportIndividualCsv = useCallback((type: string) => {
    setExportingCsv(type);
    const dateStr = new Date().toISOString().slice(0, 10);
    try {
      if (type === "entries" && allEntries) {
        downloadCsv(allEntries as unknown as Record<string, unknown>[], `daily-entries-${dateStr}.csv`);
      } else if (type === "medications" && allMedications) {
        downloadCsv(allMedications as unknown as Record<string, unknown>[], `medications-${dateStr}.csv`);
      } else if (type === "med_logs" && allMedLogs) {
        downloadCsv(allMedLogs as unknown as Record<string, unknown>[], `medication-logs-${dateStr}.csv`);
      } else if (type === "relapses" && allRelapses) {
        downloadCsv(allRelapses as unknown as Record<string, unknown>[], `relapses-${dateStr}.csv`);
      } else {
        toast.error("Data not loaded yet");
      }
    } finally {
      setExportingCsv(null);
    }
  }, [allEntries, allMedications, allMedLogs, allRelapses, downloadCsv]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [hintsResetKey, setHintsResetKey] = useState(0);

  const handleExportData = useCallback(async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-management", {
        body: { action: "export" },
      });
      if (error || !data?.success) throw new Error(error?.message || "Export failed");

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        filename = `livewithms-export-${new Date().toISOString().slice(0, 10)}.json`;
      } else {
        // Convert to CSV - one sheet per table
        const lines: string[] = [];
        for (const [table, rows] of Object.entries(data.data as Record<string, Record<string, unknown>[]>)) {
          if (!rows.length) continue;
          lines.push(`--- ${table} ---`);
          const headers = Object.keys(rows[0]);
          lines.push(headers.join(","));
          for (const row of rows) {
            lines.push(headers.map((h) => {
              const v = row[h];
              const s = v === null || v === undefined ? "" : String(v);
              return s.includes(",") || s.includes('"') || s.includes("\n")
                ? `"${s.replace(/"/g, '""')}"`
                : s;
            }).join(","));
          }
          lines.push("");
        }
        blob = new Blob([lines.join("\n")], { type: "text/csv" });
        filename = `livewithms-export-${new Date().toISOString().slice(0, 10)}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-management", {
        body: { action: "delete" },
      });
      if (error || !data?.success) throw new Error("Delete failed");
      toast.success("Account deleted. Goodbye 🧡");
      await signOut();
      navigate("/");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirmText, signOut, navigate]);

  // Initialise local state from loaded profile (once)
  if (profile && !neuroEmailInit) {
    setNeuroEmail(profile.neurologist_email ?? "");
    setNeuroName(profile.neurologist_name ?? "");
    setNeuroEmailInit(true);
  }

  if (profile && !displayNameInit) {
    setDisplayName((profile as any).display_name ?? "");
    setDisplayNameInit(true);
  }

  if (profile && !countryInit) {
    setCountry((profile as any).country ?? "");
    setCountryInit(true);
  }

  if (profile && !cityInit) {
    setCity((profile as any).city ?? "");
    setCityInit(true);
  }

  if (profile && !ageRangeInit) {
    setAgeRange(profile.age_range ?? "");
    setAgeRangeInit(true);
  }

  if (profile && !msTypeInit) {
    setMsType(profile.ms_type ?? "");
    setMsTypeInit(true);
  }

  if (profile && !yearDiagnosedInit) {
    setYearDiagnosed(profile.year_diagnosed ?? "");
    setYearDiagnosedInit(true);
  }

  if (profile && !symptomsInit) {
    setSymptoms(profile.symptoms ?? []);
    setSymptomsInit(true);
  }

  if (profile && !goalsInit) {
    setSelectedGoals(profile.goals ?? []);
    setGoalsInit(true);
  }

  const handleSaveDisplayName = async () => {
    const trimmed = displayName.trim();
    if (trimmed.length > 30) { toast.error("Display name must be under 30 characters"); return; }
    setSavingDisplayName(true);
    try {
      await updateProfile.mutateAsync({ display_name: trimmed || null } as any);
      toast.success("Community display name saved!");
    } catch {
      toast.error("Failed to save display name");
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleSaveCountry = async () => {
    setSavingCountry(true);
    try {
      await updateProfile.mutateAsync({ country: country.trim() || null } as any);
      toast.success("Country saved!");
    } catch {
      toast.error("Failed to save country");
    } finally {
      setSavingCountry(false);
    }
  };

  const handleSaveCity = async () => {
    setSavingCity(true);
    try {
      await updateProfile.mutateAsync({ city: city.trim() || null } as any);
      toast.success("City saved — heat alerts are now active!");
    } catch {
      toast.error("Failed to save city");
    } finally {
      setSavingCity(false);
    }
  };

  const handleSaveAgeRange = async () => {
    setSavingAgeRange(true);
    try {
      await updateProfile.mutateAsync({ age_range: ageRange || null } as any);
      toast.success("Age range saved!");
    } catch {
      toast.error("Failed to save age range");
    } finally {
      setSavingAgeRange(false);
    }
  };
  const msTypes = ["RRMS", "PPMS", "SPMS", "CIS", "Unknown"];
  const commonSymptoms = ["Fatigue", "Pain", "Brain Fog", "Numbness", "Vision Issues", "Spasticity", "Balance", "Bladder"];
  const goalOptions = ["Better Sleep", "More Energy", "Less Pain", "Improved Mood", "Better Mobility", "Sharper Thinking"];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1959 }, (_, i) => String(currentYear - i));

  const handleSaveYearDiagnosed = async () => {
    setSavingYearDiagnosed(true);
    try {
      await updateProfile.mutateAsync({ year_diagnosed: yearDiagnosed || null } as any);
      toast.success("Year diagnosed saved!");
    } catch {
      toast.error("Failed to save year diagnosed");
    } finally {
      setSavingYearDiagnosed(false);
    }
  };

  const handleSaveMsType = async () => {
    setSavingMsType(true);
    try {
      await updateProfile.mutateAsync({ ms_type: msType || null } as any);
      toast.success("MS type saved!");
    } catch {
      toast.error("Failed to save MS type");
    } finally {
      setSavingMsType(false);
    }
  };

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSaveSymptoms = async () => {
    setSavingSymptoms(true);
    try {
      await updateProfile.mutateAsync({ symptoms } as any);
      toast.success("Symptoms saved!");
    } catch {
      toast.error("Failed to save symptoms");
    } finally {
      setSavingSymptoms(false);
    }
  };

  const toggleGoal = (g: string) => {
    setSelectedGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      await updateProfile.mutateAsync({ goals: selectedGoals } as any);
      toast.success("Goals saved!");
    } catch {
      toast.error("Failed to save goals");
    } finally {
      setSavingGoals(false);
    }
  };

  const handleToggleDigest = async () => {
    if (!profile) return;
    const next = !profile.weekly_digest_enabled;
    setTogglingDigest(true);
    try {
      await updateProfile.mutateAsync({ weekly_digest_enabled: next } as any);
      toast.success(next ? "Weekly digest enabled — you'll get it every Monday." : "Weekly digest disabled.");
    } catch {
      toast.error("Failed to update preference.");
    } finally {
      setTogglingDigest(false);
    }
  };

  const handleSaveNeuroEmail = async () => {
    const trimmed = neuroEmail.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSavingEmail(true);
    try {
      await updateProfile.mutateAsync({
        neurologist_email: trimmed || null,
        neurologist_name: neuroName.trim() || null,
      } as any);
      toast.success("Neurologist details saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSendTestDigest = async () => {
    if (!user?.email) return;
    setSendingTestDigest(true);
    try {
      const res = await fetch(
        `https://fpjfoadvytpvrhligdye.supabase.co/functions/v1/send-weekly-digest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test_email: user.email }),
        }
      );
      const json = await res.json();
      const result = json?.results?.[0];
      if (result?.status === "sent") {
        await updateProfile.mutateAsync({ last_digest_sent_at: new Date().toISOString() } as any);
        toast.success("Test digest sent! Check your inbox.");
      } else {
        toast.error(result?.error ?? "Failed to send test digest.");
      }
    } catch {
      toast.error("Failed to send test digest.");
    } finally {
      setSendingTestDigest(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <SEOHead title="Profile" description="Manage your LiveWithMS account, preferences and notification settings." />
      <PageHeader title="Profile" subtitle="Your MS companion settings" showBack />
      <StaggerContainer className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* User info */}
        <StaggerItem>
        <div className="card-base">
          <div className="flex items-center gap-3">
            <AvatarUpload currentUrl={(profile as any)?.avatar_url ?? null} />
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {profile?.ms_type ? `${profile.ms_type} Profile` : "My MS Profile"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/my-ms-history"
            className="mt-3 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>My MS History</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            to="/badges"
            className="mt-2 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>🏆 Badges & Achievements</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            to="/messages"
            className="mt-2 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          {allBadgesEarned && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-accent/10 p-3 shadow-soft">
              <span className="text-3xl">🏆</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Completionist</p>
                <p className="text-[10px] text-muted-foreground">All 15 badges unlocked — you're incredible! 🎉</p>
              </div>
              <span className="text-xs font-semibold text-primary">15/15</span>
            </div>
          )}
          <Link
            to="/onboarding"
            className="mt-2 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>Re-run Onboarding</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              ["onboarding_tour_v1", "onboarding_tour_track_v1", "onboarding_tour_insights_v2", "onboarding_tour_community_v1", "onboarding_tour_journal_v3", "onboarding_tour_learn_v2", "onboarding_tour_relapses_v2", "onboarding_tour_medications_v1", "onboarding_tour_appointments_v1", "onboarding_tour_reports_v1", "onboarding_tour_profile_v1"].forEach((k) => localStorage.removeItem(k));
              toast.success("All page tours reset! Visit each page to see the guides again 🗺️");
            }}
            className="mt-2 flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Page Tours
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
          {/* Hints summary */}
          {(() => {
            const HINTS = [
              { key: "lp_unpin_used", label: "Hold pill to unpin", page: "Today", path: "/today" },
              { key: "hint_drag_reorder_used", label: "Drag to reorder pills", page: "Today", path: "/today" },
              { key: "hint_coach_swipe_used", label: "Swipe to manage conversations", page: "Coach", path: "/coach" },
              { key: "hint_insights_stat_tap_used", label: "Tap stat card to isolate", page: "Insights", path: "/insights" },
              { key: "hint_meds_tap_used", label: "Tap med to log it", page: "Medications", path: "/medications" },
              { key: "hint_journal_swipe_used", label: "Swipe entry to edit/delete", page: "Journal", path: "/journal" },
            ];
            const active = HINTS.filter((h) => !localStorage.getItem(h.key));
            const dismissed = HINTS.filter((h) => localStorage.getItem(h.key));
            const hintGroups = Object.entries(
              HINTS.reduce<Record<string, typeof HINTS>>((groups, h) => {
                (groups[h.page] ??= []).push(h);
                return groups;
              }, {})
            );
            const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
            const allOpen = hintGroups.every(([page]) => openGroups[page]);
            const toggleAll = () => {
              const next = !allOpen;
              const updated: Record<string, boolean> = {};
              hintGroups.forEach(([page]) => { updated[page] = next; });
              setOpenGroups(updated);
            };
            const pct = Math.round((dismissed.length / HINTS.length) * 100);
            const barColor = pct >= 80 ? "bg-brand-green" : pct >= 40 ? "bg-amber-500" : "bg-destructive";
            const confettiKey = `hint_completion_confetti_${HINTS.length}`;
            const prevCountSessionKey = "hint_prev_count";
            const storedPrev = Number(sessionStorage.getItem(prevCountSessionKey) ?? dismissed.length);
            const prevCountRef = useRef(storedPrev);
            const [barGlow, setBarGlow] = useState(false);
            const halfwayKey = "hint_halfway_celebrated";
            const [showHalfwayBanner, setShowHalfwayBanner] = useState(false);
            useEffect(() => {
              if (pct === 100 && !sessionStorage.getItem(confettiKey)) {
                sessionStorage.setItem(confettiKey, "1");
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#22c55e", "#f59e0b", "#3b82f6", "#a855f7"] });
              }
            }, [pct, confettiKey]);
            useEffect(() => {
              if (pct >= 50 && !sessionStorage.getItem(halfwayKey) && pct < 100) {
                sessionStorage.setItem(halfwayKey, "1");
                // Double burst from left and right
                confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ["#f59e0b", "#22c55e", "#3b82f6"] });
                confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ["#f59e0b", "#22c55e", "#3b82f6"] });
                if (navigator.vibrate) navigator.vibrate([50, 80, 50]);
                setBarGlow(true);
                setShowHalfwayBanner(true);
                const t1 = setTimeout(() => setBarGlow(false), 2500);
                const t2 = setTimeout(() => setShowHalfwayBanner(false), 8000);
                return () => { clearTimeout(t1); clearTimeout(t2); };
              }
            }, [pct]);
            useEffect(() => {
              if (dismissed.length > prevCountRef.current && pct < 100) {
                confetti({ particleCount: 30, spread: 50, startVelocity: 20, gravity: 0.8, origin: { y: 0.5 }, scalar: 0.7, colors: ["#f59e0b", "#22c55e", "#3b82f6"] });
                if (navigator.vibrate) navigator.vibrate(50);
                setBarGlow(true);
                const t = setTimeout(() => setBarGlow(false), 2500);
                prevCountRef.current = dismissed.length;
                sessionStorage.setItem(prevCountSessionKey, String(dismissed.length));
                return () => clearTimeout(t);
              }
              prevCountRef.current = dismissed.length;
              sessionStorage.setItem(prevCountSessionKey, String(dismissed.length));
            }, [dismissed.length, pct]);
             return (
              <div className="mt-3 rounded-xl bg-card border border-border p-3 space-y-2">
                <AnimatePresence>
                  {showHalfwayBanner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 mb-1">
                        <span className="text-lg leading-none mt-0.5">🎯</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Halfway there!</p>
                          <p className="text-xs text-muted-foreground mt-0.5">You've discovered half the hidden interactions. Keep exploring to find them all!</p>
                        </div>
                        <button
                          onClick={() => setShowHalfwayBanner(false)}
                          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Hint Status</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAll}
                        className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {allOpen ? "Collapse all" : "Expand all"}
                      </button>
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {pct}%
                        {barGlow && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0, rotate: 0 }}
                            animate={{
                              scale: [0, 1.5, 0.9, 1.2, 1, 1.15, 1, 1.15, 1, 1.15, 1],
                              rotate: [0, -20, 15, -10, 0, 12, 0, -12, 0, 12, 0],
                              opacity: 1,
                            }}
                            transition={{
                              scale: { times: [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.62, 0.72, 0.79, 0.89, 1], duration: 2.2, ease: "easeOut", delay: 0.2 },
                              rotate: { times: [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.62, 0.72, 0.79, 0.89, 1], duration: 2.2, ease: "easeOut", delay: 0.2 },
                              opacity: { duration: 0.15, delay: 0.2 },
                            }}
                            className="inline-block ml-0.5"
                          >
                            ✨
                          </motion.span>
                        )}
                      </span>
                    </div>
                  </div>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className="h-1.5 w-full rounded-full bg-secondary overflow-hidden cursor-help"
                          animate={barGlow ? {
                            boxShadow: [
                              "0 0 8px 2px hsl(var(--primary) / 0.4)",
                              "0 0 14px 4px hsl(var(--primary) / 0.6)",
                              "0 0 8px 2px hsl(var(--primary) / 0.4)",
                              "0 0 14px 4px hsl(var(--primary) / 0.6)",
                              "0 0 8px 2px hsl(var(--primary) / 0.4)",
                              "0 0 14px 4px hsl(var(--primary) / 0.6)",
                              "0 0 8px 2px hsl(var(--primary) / 0.4)",
                              "0 0 0px 0px hsl(var(--primary) / 0)",
                            ],
                          } : { boxShadow: "0 0 0px 0px hsl(var(--primary) / 0)" }}
                          transition={{ boxShadow: { times: [0, 0.18, 0.36, 0.5, 0.64, 0.78, 0.9, 1], duration: 2.2, delay: 0.2 } }}
                        >
                          <motion.div
                            className={`h-full rounded-full ${barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
                          />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {dismissed.length} / {HINTS.length} hints seen
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {pct < 100 && (
                    <div className="flex items-center gap-3 pt-0.5">
                      <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50"><span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />0–39%</span>
                      <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />40–79%</span>
                      <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50"><span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-green" />80–100%</span>
                    </div>
                  )}
                </div>
                {hintGroups.map(([page, hints]) => {
                  const seenCount = hints.filter((h) => localStorage.getItem(h.key)).length;
                  return (
                    <Collapsible key={page} open={!!openGroups[page]} onOpenChange={(v) => setOpenGroups((prev) => ({ ...prev, [page]: v }))}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between pt-1 group/trigger">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 group-hover/trigger:text-muted-foreground transition-colors">
                          {page}
                          {seenCount > 0 && <span className="ml-1 text-muted-foreground/30">({seenCount}/{hints.length})</span>}
                        </span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground/30 transition-transform duration-200 group-data-[state=closed]/trigger:rotate-[-90deg]" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <div className="space-y-1 pt-1">
                          {hints.map((h) => {
                            const isActive = !localStorage.getItem(h.key);
                            return (
                              <Link key={h.key} to={h.path} className="flex items-center justify-between text-xs group pl-2">
                                <span className="text-foreground group-hover:text-primary transition-colors">{h.label}</span>
                                <span key={hintsResetKey} className={`flex items-center gap-1 text-[10px] font-medium ${isActive ? "text-brand-green" : "text-muted-foreground/50"} ${hintsResetKey > 0 && isActive ? "animate-scale-in" : ""}`}>
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-brand-green" : "bg-muted-foreground/30"}`} />
                                  {isActive ? "Active" : "Seen"}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {pct === 100
                      ? <Link to="/badges" className="inline-flex items-center gap-1 text-brand-green font-medium animate-fade-in hover:underline">🎉 All hints explored — see your badges →</Link>
                      : active.length === HINTS.length
                        ? "All hints active — explore the app!"
                        : `${dismissed.length}/${HINTS.length} hints seen`}
                  </p>
                  {dismissed.length > 0 && (
                    <button
                      onClick={() => {
                        HINTS.forEach((h) => localStorage.removeItem(h.key));
                        sessionStorage.removeItem("hint_prev_count");
                        setHintsResetKey((k) => k + 1);
                        toast.success("Interaction hints reset! They'll reappear as you use the app 💡");
                        confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#22c55e", "#f59e0b", "#3b82f6"] });
                      }}
                      className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground transition-colors hover:bg-muted"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
          <button
            onClick={() => {
              ["lp_unpin_used", "hint_drag_reorder_used", "hint_coach_swipe_used", "hint_insights_stat_tap_used", "hint_meds_tap_used", "hint_journal_swipe_used"].forEach((k) => localStorage.removeItem(k));
              sessionStorage.removeItem("hint_prev_count");
              setHintsResetKey((k) => k + 1);
              toast.success("Interaction hints reset! They'll reappear as you use the app 💡");
              confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#22c55e", "#f59e0b", "#3b82f6"] });
            }}
            className="mt-2 flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Hints
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              className="mt-2 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/20"
            >
              <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        </StaggerItem>

        {/* MS Details */}
        <StaggerItem>
        <div data-tour="profile-ms-details" className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Community Display Name</p>
          </div>
          <p className="text-xs text-muted-foreground">This name is shown on your posts and comments in the Community forum.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveDisplayName()}
              placeholder="e.g. MSWarrior_22"
              maxLength={30}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleSaveDisplayName}
              disabled={savingDisplayName}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingDisplayName ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Country */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Country</p>
          </div>
          <p className="text-xs text-muted-foreground">Helps connect you with local resources and community members.</p>
          <div className="flex gap-2">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select a country</option>
              {["United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
                "Netherlands", "Spain", "Italy", "Sweden", "Norway", "Denmark", "Finland",
                "Belgium", "Switzerland", "Austria", "Ireland", "New Zealand", "Brazil",
                "Mexico", "India", "Japan", "South Korea", "South Africa", "Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleSaveCountry}
              disabled={savingCountry}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingCountry ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* City (for heat alerts) */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">City</p>
          </div>
          <p className="text-xs text-muted-foreground">Used for environmental heat alerts — we'll warn you when temperatures may worsen MS symptoms.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. London, New York, Sydney"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleSaveCity}
              disabled={savingCity}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingCity ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Age Range */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Age Range</p>
          </div>
          <p className="text-xs text-muted-foreground">Helps personalize insights for your age group.</p>
          <div className="flex gap-2">
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select age range</option>
              {["18–24", "25–34", "35–44", "45–54", "55–64", "65+"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={handleSaveAgeRange}
              disabled={savingAgeRange}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingAgeRange ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* MS Type */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">MS Type</p>
          </div>
          <p className="text-xs text-muted-foreground">Your MS diagnosis type helps personalize your experience.</p>
          <div className="flex gap-2">
            <select
              value={msType}
              onChange={(e) => setMsType(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select MS type</option>
              {msTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={handleSaveMsType}
              disabled={savingMsType}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingMsType ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Year Diagnosed */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Year Diagnosed</p>
          </div>
          <p className="text-xs text-muted-foreground">When were you first diagnosed with MS?</p>
          <div className="flex gap-2">
            <select
              value={yearDiagnosed}
              onChange={(e) => setYearDiagnosed(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={handleSaveYearDiagnosed}
              disabled={savingYearDiagnosed}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {savingYearDiagnosed ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Symptoms */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Key Symptoms</p>
          </div>
          <p className="text-xs text-muted-foreground">Select the symptoms that affect you most.</p>
          <div className="flex flex-wrap gap-2">
            {commonSymptoms.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                  symptoms.includes(s) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveSymptoms}
            disabled={savingSymptoms}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
          >
            {savingSymptoms ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save Symptoms
          </button>
        </div>

        {/* Goals */}
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Your Goals</p>
          </div>
          <p className="text-xs text-muted-foreground">What would you like to improve?</p>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((g) => (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                  selectedGoals.includes(g) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveGoals}
            disabled={savingGoals}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
          >
            {savingGoals ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save Goals
          </button>
        </div>
        </StaggerItem>

        {/* Neurologist details */}
        <StaggerItem>
        <div data-tour="profile-neurologist" className="card-base space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Neurologist Details</p>
          </div>
          <p className="text-xs text-muted-foreground">Used when sending PDF reports directly to your neurologist.</p>
          <div className="space-y-2 pt-1">
            <input
              type="text"
              value={neuroName}
              onChange={(e) => setNeuroName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNeuroEmail()}
              placeholder="Dr. Smith"
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <input
                type="email"
                value={neuroEmail}
                onChange={(e) => setNeuroEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveNeuroEmail()}
                placeholder="doctor@neurology.com"
                maxLength={255}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={handleSaveNeuroEmail}
                disabled={savingEmail}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {savingEmail ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Report */}
        <Link
          to="/reports"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent p-4 shadow-soft transition-all hover:shadow-card active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Doctor-Ready Report</p>
            <p className="text-xs text-muted-foreground">Generate PDF for your neurologist</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        </StaggerItem>

        {/* Settings */}
        <StaggerItem>
        <div className="space-y-1">
          <p data-tour="profile-notifications" className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Settings</p>

          {/* Theme selector */}
          <div className="card-base space-y-3">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              <p className="text-sm font-medium text-foreground">Appearance</p>
            </div>
            <p className="text-xs text-muted-foreground">Choose how LiveWithMS looks to you.</p>
            {mounted && (
              <ThemeToggle />
            )}
          </div>

          <NotificationToggle />

          {/* Notification Settings Link */}
          <Link to="/notifications/settings" className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground">
            <Bell className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Notification Settings</p>
              <p className="text-xs text-muted-foreground">Manage all your notification preferences</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Link>

          {/* Weekly digest toggle */}
          <button
            onClick={handleToggleDigest}
            disabled={togglingDigest || !profile}
            className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground disabled:opacity-60"
          >
            <Mails className="h-4 w-4 flex-shrink-0 mt-0.5 self-start" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Weekly Email Digest</p>
              <p className="text-xs text-muted-foreground">Symptom summary every Monday morning</p>

              {profile?.weekly_digest_enabled && (
                <div className="mt-2 space-y-2">
                  {/* Goal picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-0.5">Goal:</span>
                    {[3, 5, 7].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProfile.mutate({ weekly_log_goal: g } as any);
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors border ${
                          (profile.weekly_log_goal ?? 7) === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {g}×/wk
                      </button>
                    ))}
                  </div>

                  {/* Progress bar + week streak badge */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min((daysLoggedThisWeek / (profile.weekly_log_goal ?? 7)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-foreground shrink-0">
                      {daysLoggedThisWeek}/{profile.weekly_log_goal ?? 7}
                    </span>
                    {weekStreak >= 2 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300 shrink-0">
                        {weekStreak} wk 🔥
                      </span>
                    )}
                    {weekStreak === 1 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                        1 wk ⚡
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {getWeeklyMotivation(daysLoggedThisWeek, profile.weekly_log_goal ?? 7)}
                    </p>
                    <p className="text-[11px] text-primary shrink-0">Next: {getNextMonday()}</p>
                  </div>

                  {/* Send test digest */}
                  <div className="mt-1 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendTestDigest();
                      }}
                      disabled={sendingTestDigest}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
                    >
                      {sendingTestDigest ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Mails className="h-3 w-3" />
                      )}
                      {sendingTestDigest ? "Sending…" : "Send test digest now"}
                    </button>
                    {profile?.last_digest_sent_at && (
                      <p className="text-[10px] text-muted-foreground pl-0.5">
                        Last sent:{" "}
                        {new Date(profile.last_digest_sent_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Digest preview card */}
                  <DigestPreviewCard
                    entries={weekEntries ?? []}
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    weeklyLogGoal={profile.weekly_log_goal ?? 7}
                    weekStreak={weekStreak}
                  />
                </div>
              )}
            </div>
            <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 mt-0.5 self-start ${profile?.weekly_digest_enabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${profile?.weekly_digest_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>

          {/* Sleep goal setting */}
          {profile && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-3">
              <Moon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Sleep Target</p>
                <p className="text-xs text-muted-foreground mb-1.5">Daily hours goal for progress ring</p>
                <div className="flex items-center gap-1.5">
                  {[6, 7, 7.5, 8, 9].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateProfile.mutate({ sleep_goal: h } as any)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors border ${
                        (profile.sleep_goal ?? 8) === h
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hydration reminder time */}
          {profile && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-3">
              <Droplets className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Hydration Reminder Time</p>
                <p className="text-xs text-muted-foreground mb-1.5">When to nudge you if water intake is low</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "12 PM", h: 12 },
                    { label: "1 PM", h: 13 },
                    { label: "2 PM", h: 14 },
                    { label: "3 PM", h: 15 },
                    { label: "4 PM", h: 16 },
                    { label: "5 PM", h: 17 },
                    { label: "6 PM", h: 18 },
                  ].map(({ label, h }) => {
                    // Convert local hour to UTC for storage
                    const d = new Date();
                    d.setHours(h, 0, 0, 0);
                    const utcH = d.getUTCHours();
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          updateProfile.mutate({ hydration_reminder_hour: utcH } as any);
                          toast.success(`Hydration reminder set for ${label}`);
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors border ${
                          (profile as any).hydration_reminder_hour === utcH
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Hydration daily goal */}
          {profile && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-3">
              <Target className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Daily Hydration Goal</p>
                <p className="text-xs text-muted-foreground mb-1.5">Glasses of water per day</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[4, 6, 8, 10, 12].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        updateProfile.mutate({ hydration_goal: g } as any);
                        toast.success(`Hydration goal set to ${g} glasses`);
                      }}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors border ${
                        profile.hydration_goal === g
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Streak Freeze toggle */}
          {profile && (
            <button
              type="button"
              onClick={() => updateProfile.mutate({ streak_freeze_enabled: !profile.streak_freeze_enabled } as any)}
              className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
            >
              <Snowflake className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Streak Freeze</p>
                <p className="text-xs text-muted-foreground">Preserve your streak if you miss 1 day per week</p>
              </div>
              <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${profile.streak_freeze_enabled ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${profile.streak_freeze_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}

          {/* Cognitive Streak Freeze toggle */}
          {profile && (
            <button
              type="button"
              onClick={() => updateProfile.mutate({ cog_streak_freeze_enabled: !(profile as any).cog_streak_freeze_enabled } as any)}
              className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
            >
              <Snowflake className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Brain Training Freeze</p>
                <p className="text-xs text-muted-foreground">Preserve your cognitive streak if you miss 1 day per week</p>
              </div>
              <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${(profile as any).cog_streak_freeze_enabled ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${(profile as any).cog_streak_freeze_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}

          {/* Allow DMs toggle */}
          {profile && (
            <button
              type="button"
              onClick={() => updateProfile.mutate({ allow_dms: !(profile as any).allow_dms } as any)}
              className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Allow Direct Messages</p>
                <p className="text-xs text-muted-foreground">Let other community members message you</p>
              </div>
              <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${(profile as any).allow_dms ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${(profile as any).allow_dms ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}

          {/* AI Memory toggle */}
          {profile && (
            <button
              type="button"
              onClick={() => updateProfile.mutate({ ai_memory_enabled: !(profile as any).ai_memory_enabled } as any)}
              className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
            >
              <Sparkles className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">AI Memory</p>
                <p className="text-xs text-muted-foreground">Let your AI Coach remember your preferences across sessions</p>
              </div>
              <div className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${(profile as any).ai_memory_enabled ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${(profile as any).ai_memory_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}


          {[
            { icon: Shield, label: "Privacy & Data", desc: "Manage your data preferences", to: "/privacy" },
            { icon: Sparkles, label: "Feature Roadmap", desc: "See what's coming next", to: "/roadmap" },
          ].map(({ icon: Icon, label, desc, to }) => (
            <Link key={label} to={to} className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </Link>
          ))}

          {/* Export Data */}
          <div className="card-base space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Export Your Data</p>
            </div>
            <p className="text-xs text-muted-foreground">Download all your health data, entries, and profile information.</p>

            {/* Individual CSV exports */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Individual CSV Downloads</p>
              {[
                { key: "entries", label: "Daily Entries", count: allEntries?.length },
                { key: "medications", label: "Medications", count: allMedications?.length },
                { key: "med_logs", label: "Medication Logs", count: allMedLogs?.length },
                { key: "relapses", label: "Relapses", count: allRelapses?.length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => handleExportIndividualCsv(key)}
                  disabled={exportingCsv === key || !count}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {label}
                    <span className="text-muted-foreground">({count ?? 0})</span>
                  </span>
                  <Download className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            {/* Full export */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Full Export (All Data)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportData("json")}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
                >
                  {exporting ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  JSON
                </button>
                <button
                  onClick={() => handleExportData("csv")}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
                >
                  {exporting ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  CSV
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
          </button>
        </div>
        </StaggerItem>

        {/* Delete Account */}
        <StaggerItem>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm font-medium text-destructive">Danger Zone</p>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete My Account
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                This will <strong className="text-destructive">permanently delete</strong> all your data including entries, medications, appointments, and community posts. This cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground">
                Type <strong className="text-foreground">DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground transition-all hover:opacity-90 disabled:opacity-40"
                >
                  {deleting ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deleting ? "Deleting…" : "Delete Forever"}
                </button>
              </div>
            </div>
          )}
        </div>
        </StaggerItem>

        {/* Crisis resources */}
        <StaggerItem>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs font-medium text-foreground">Need support?</p>
          <a href="https://www.nationalmssociety.org" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            National MS Society <ExternalLink className="h-3 w-3" />
          </a>
          <p className="mt-2 text-[10px] text-muted-foreground">Crisis Line: 988 (Suicide & Crisis Lifeline)</p>
        </div>
        </StaggerItem>

        <StaggerItem>
        <p className="pb-4 text-center text-[10px] text-muted-foreground">
          LiveWithMS v1.0 · Not medical advice · © 2026
        </p>
        </StaggerItem>
      </StaggerContainer>
    </>
  );
};

export default ProfilePage;
