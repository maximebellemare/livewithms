import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTodayEntry } from "@/hooks/useEntries";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { useTodayBudget } from "@/hooks/useEnergyBudget";
import { format } from "date-fns";

interface Suggestion {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  action: () => void;
  priority: number;
}

const SuggestedNextCards = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayEntry } = useTodayEntry();
  const { data: allMeds = [] } = useDbMedications();
  const { data: medLogs = [] } = useDbMedicationLogs(today, today);
  const { data: todayBudget } = useTodayBudget();

  const activeDailyMeds = allMeds.filter((m) => m.active && m.schedule_type === "daily");
  const unloggedMeds = activeDailyMeds.filter(
    (m) => !medLogs.some((l) => l.medication_id === m.id)
  );

  const suggestions = useMemo(() => {
    const items: Suggestion[] = [];

    // 1. Haven't logged symptoms at all
    if (!todayEntry) {
      items.push({
        id: "log-symptoms",
        emoji: "✏️",
        title: "Log your symptoms",
        subtitle: "Start today's check-in to track how you're feeling",
        action: () => {
          document.querySelector("[data-tour='quick-log']")?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        priority: 1,
      });
    }

    // 2. Medications not taken
    if (unloggedMeds.length > 0) {
      items.push({
        id: "take-meds",
        emoji: "💊",
        title: `${unloggedMeds.length} med${unloggedMeds.length > 1 ? "s" : ""} left today`,
        subtitle: unloggedMeds.map((m) => m.name).slice(0, 3).join(", "),
        action: () => navigate("/medications"),
        priority: 2,
      });
    }

    // 3. No hydration logged (check todayEntry water_glasses)
    if (todayEntry && (todayEntry.water_glasses ?? 0) === 0) {
      items.push({
        id: "hydration",
        emoji: "💧",
        title: "Track your water intake",
        subtitle: "Stay hydrated — tap to log your first glass",
        action: () => {
          document.querySelector("[data-tour='reminders']")?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        priority: 4,
      });
    }

    // 4. No energy budget set
    if (!todayBudget) {
      items.push({
        id: "energy-budget",
        emoji: "🥄",
        title: "Plan your energy budget",
        subtitle: "Manage today's spoons to pace yourself",
        action: () => navigate("/energy"),
        priority: 3,
      });
    }

    // 5. No mood tags selected (logged but no tags)
    if (todayEntry && (!todayEntry.mood_tags || todayEntry.mood_tags.length === 0)) {
      items.push({
        id: "mood-tags",
        emoji: "🏷️",
        title: "Add mood tags",
        subtitle: "Describe how you're feeling with a few tags",
        action: () => {
          document.querySelector("[data-tour='mood-tags']")?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        priority: 5,
      });
    }

    // 6. No notes written
    if (todayEntry && !todayEntry.notes) {
      items.push({
        id: "journal",
        emoji: "📝",
        title: "Write a quick note",
        subtitle: "Jot down anything you want to remember",
        action: () => navigate("/journal"),
        priority: 6,
      });
    }

    // 7. Suggest cognitive exercise
    items.push({
      id: "cognitive",
      emoji: "🧩",
      title: "Train your brain",
      subtitle: "Quick cognitive exercise to stay sharp",
      action: () => navigate("/cognitive"),
      priority: 7,
    });

    return items.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [todayEntry, unloggedMeds, todayBudget, navigate]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="section-label">💡 Suggested Next</p>
      <AnimatePresence mode="popLayout">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            onClick={s.action}
            className="flex w-full items-center gap-3 card-base text-left transition-colors hover:bg-secondary/50 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg">
              {s.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">{s.subtitle}</p>
            </div>
            <span className="text-xs text-primary font-medium">→</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SuggestedNextCards;
