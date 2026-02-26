import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";
import { useMealLogs, useAddMealLog, useDeleteMealLog } from "@/hooks/useMealLogs";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_EMOJIS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

const today = format(new Date(), "yyyy-MM-dd");

export default function MealDiary() {
  const { data: logs = [] } = useMealLogs(7);
  const addMeal = useAddMealLog();
  const deleteMeal = useDeleteMealLog();
  const [showForm, setShowForm] = useState(false);
  const [mealType, setMealType] = useState<string>("lunch");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) { toast.error("Enter a meal name"); return; }
    try {
      await addMeal.mutateAsync({ date: today, meal_type: mealType, name: name.trim(), notes: notes.trim() || null });
      toast.success("Meal logged! 🍽️");
      setName("");
      setNotes("");
      setShowForm(false);
    } catch { toast.error("Failed to log meal"); }
  };

  const todayLogs = logs.filter(l => l.date === today);
  const pastLogs = logs.filter(l => l.date !== today);

  // Group past logs by date
  const groupedPast: Record<string, typeof logs> = {};
  pastLogs.forEach(l => {
    if (!groupedPast[l.date]) groupedPast[l.date] = [];
    groupedPast[l.date].push(l);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Today's Food Diary</h3>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-card p-4 shadow-soft space-y-3 border border-border">
              <div className="flex gap-1">
                {MEAL_TYPES.map(t => (
                  <button key={t} onClick={() => setMealType(t)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-all ${mealType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {MEAL_EMOJIS[t]} {t}
                  </button>
                ))}
              </div>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="What did you eat?"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" maxLength={150} autoFocus />
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" maxLength={200} />
              <button onClick={handleAdd} disabled={addMeal.isPending || !name.trim()}
                className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {addMeal.isPending ? "Saving…" : "Log Meal"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's meals */}
      {todayLogs.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-4">No meals logged today. Tap + to start your food diary.</p>
      ) : (
        <div className="space-y-1.5">
          {todayLogs.map(log => (
            <div key={log.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-soft border border-border">
              <span className="text-lg flex-shrink-0">{MEAL_EMOJIS[log.meal_type] || "🍽️"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{log.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{log.meal_type}{log.notes ? ` · ${log.notes}` : ""}</p>
              </div>
              <button onClick={() => deleteMeal.mutate(log.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Past days */}
      {Object.keys(groupedPast).length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Recent Days</p>
          {Object.entries(groupedPast).slice(0, 5).map(([date, dayLogs]) => (
            <div key={date} className="rounded-xl bg-secondary/50 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{format(new Date(date + "T12:00:00"), "EEEE, MMM d")}</p>
              {dayLogs.map(log => (
                <div key={log.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs">{MEAL_EMOJIS[log.meal_type] || "🍽️"}</span>
                  <span className="text-foreground/90">{log.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">· {log.meal_type}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
