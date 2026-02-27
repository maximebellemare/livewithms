import { useState, useMemo, useEffect, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check, Zap, Battery, BatteryLow, BatteryWarning, ChevronDown, ChevronUp, Info, ExternalLink, Star, Pencil, Trash2 } from "lucide-react";
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
import SwipeableActivityRow from "@/components/energy/SwipeableActivityRow";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useTodayBudget,
  useBudgetActivities,
  useCreateBudget,
  useAddActivity,
  useToggleActivity,
  useDeleteActivity,
  useUpdateBudget,
  useEnergyHistory,
  useFrequentActivities,
  useUpdateActivityCost,
  useReorderActivities,
  useRestoreActivity,
} from "@/hooks/useEnergyBudget";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import WeeklyTrendsChart from "@/components/energy/WeeklyTrendsChart";
import OverexertionAlert from "@/components/energy/OverexertionAlert";
import FatigueCorrelation from "@/components/energy/FatigueCorrelation";
import AppointmentImport from "@/components/energy/AppointmentImport";
import RestBufferSuggestion from "@/components/energy/RestBufferSuggestion";
import EndOfDayReflection from "@/components/energy/EndOfDayReflection";
import WeeklyConsistency from "@/components/energy/WeeklyConsistency";

const SPOON_KEY = "livewithms_last_spoon_count";

const PRESET_ACTIVITIES = [
  { name: "Shower", cost: 2 },
  { name: "Cooking", cost: 2 },
  { name: "Grocery shopping", cost: 3 },
  { name: "Light exercise", cost: 2 },
  { name: "Work (1 hour)", cost: 2 },
  { name: "Social event", cost: 3 },
  { name: "Cleaning", cost: 2 },
  { name: "Walking", cost: 1 },
  { name: "Doctor visit", cost: 3 },
  { name: "Rest / Nap", cost: 0 },
];

function SortableActivityRow(props: {
  activity: { id: string; name: string; spoon_cost: number; completed: boolean };
  onToggle: () => void;
  onDelete: () => void;
  onUpdateCost: (cost: number) => void;
  editingCostId: string | null;
  setEditingCostId: (id: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.activity.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SwipeableActivityRow
        {...props}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

const EnergyBudgetPage = () => {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: budget, isLoading } = useTodayBudget();
  const { data: activities = [] } = useBudgetActivities(budget?.id);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const addActivity = useAddActivity();
  const toggleActivity = useToggleActivity();
  const deleteActivity = useDeleteActivity();
  const updateActivityCost = useUpdateActivityCost();
  const reorderActivities = useReorderActivities();
  const restoreActivity = useRestoreActivity();
  const { data: history = [] } = useEnergyHistory(7);
  const { data: frequentActivities = [] } = useFrequentActivities(6);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [showClearCompleted, setShowClearCompleted] = useState(false);

  const completedActivities = useMemo(() => activities.filter(a => a.completed), [activities]);

  const handleClearCompleted = () => {
    completedActivities.forEach(a => deleteActivity.mutate(a.id));
    toast.success(`${completedActivities.length} completed activit${completedActivities.length === 1 ? "y" : "ies"} cleared`);
    setShowClearCompleted(false);
  };
  const [swipeHintDismissed, setSwipeHintDismissed] = useState(() => localStorage.getItem("hint_energy_swipe_used") === "1");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => Number(a.completed) - Number(b.completed) || a.sort_order - b.sort_order),
    [activities]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortedActivities.findIndex((a) => a.id === active.id);
      const newIndex = sortedActivities.findIndex((a) => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...sortedActivities];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      const updates = reordered.map((a, i) => ({ id: a.id, sort_order: i }));
      reorderActivities.mutate(updates);
    },
    [sortedActivities, reorderActivities]
  );

  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState(1);
  const [showSpoonDialog, setShowSpoonDialog] = useState(false);
  const [editingSpoons, setEditingSpoons] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [spoonCount, setSpoonCount] = useState(() => {
    try {
      const saved = localStorage.getItem(SPOON_KEY);
      return saved ? parseInt(saved, 10) : 12;
    } catch { return 12; }
  });

  const usedSpoons = useMemo(
    () => activities.filter((a) => a.completed).reduce((s, a) => s + a.spoon_cost, 0),
    [activities]
  );
  const plannedSpoons = useMemo(
    () => activities.reduce((s, a) => s + a.spoon_cost, 0),
    [activities]
  );
  const totalSpoons = budget?.total_spoons ?? 12;
  const remaining = totalSpoons - plannedSpoons;
  const overBudget = remaining < 0;
  const pct = Math.min((plannedSpoons / totalSpoons) * 100, 100);

  const handleCreateBudget = async () => {
    try {
      localStorage.setItem(SPOON_KEY, String(spoonCount));
      await createBudget.mutateAsync({ date: today, total_spoons: spoonCount });
      toast.success("Energy budget set for today!");
    } catch {
      toast.error("Failed to create budget");
    }
  };

  const handleAddActivity = async () => {
    if (!newName.trim() || !budget) return;
    try {
      await addActivity.mutateAsync({ budget_id: budget.id, name: newName.trim(), spoon_cost: newCost });
      setNewName("");
      setNewCost(1);
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add activity");
    }
  };

  const handleAddPreset = async (preset: typeof PRESET_ACTIVITIES[0]) => {
    if (!budget) return;
    try {
      await addActivity.mutateAsync({ budget_id: budget.id, name: preset.name, spoon_cost: preset.cost });
      toast.success(`Added "${preset.name}"`);
    } catch {
      toast.error("Failed to add activity");
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Energy Budget" subtitle="Spoon Theory Planner" showBack />
        <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </>
    );
  }

  // No budget yet — setup screen
  if (!budget) {
    return (
      <>
        <SEOHead title="Energy Budget" description="Plan your daily energy using the Spoon Theory." />
        <PageHeader title="Energy Budget" subtitle="Spoon Theory Planner 🥄" showBack />
        <div className="mx-auto max-w-lg px-4 py-8 space-y-6 animate-fade-in">
          <div className="rounded-xl bg-card p-6 shadow-soft text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-accent flex items-center justify-center">
              <span className="text-3xl">🥄</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">How many spoons do you have today?</h2>
            <p className="text-sm text-muted-foreground">
              The <span className="font-semibold text-foreground">Spoon Theory</span> was created by Christine Miserandino to explain what it's like living with a chronic illness. Imagine starting each day with a limited number of spoons — each one represents a unit of energy. Every activity, from showering to cooking, "costs" spoons. When they're gone, you're done for the day.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This planner helps you budget your energy so you can prioritize what matters most and avoid crashing.
            </p>
            <div className="rounded-lg bg-secondary/60 p-3 text-left space-y-1.5">
              <p className="text-xs font-semibold text-foreground">💡 How to choose your number</p>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-none">
                <li><span className="font-medium text-foreground">Bad day / flare-up:</span> 4–6 spoons</li>
                <li><span className="font-medium text-foreground">Average day:</span> 8–12 spoons</li>
                <li><span className="font-medium text-foreground">Good day:</span> 12–16 spoons</li>
              </ul>
              <p className="text-[11px] text-muted-foreground">Start with how you feel <span className="italic">right now</span> — you can always adjust later.</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSpoonCount(Math.max(1, spoonCount - 1))}
                className="rounded-full bg-secondary p-2 text-foreground hover:bg-muted active:scale-95 transition-all"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-4xl font-display font-bold text-primary min-w-[3ch] text-center">{spoonCount}</span>
              <button
                onClick={() => setSpoonCount(Math.min(20, spoonCount + 1))}
                className="rounded-full bg-secondary p-2 text-foreground hover:bg-muted active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({ length: spoonCount }).map((_, i) => (
                <span key={i} className="text-lg">🥄</span>
              ))}
            </div>
            <button
              onClick={handleCreateBudget}
              disabled={createBudget.isPending}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {createBudget.isPending ? "Setting up…" : "Start my day"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Energy Budget" description="Track your daily energy using the Spoon Theory." />
      <PageHeader title="Energy Budget" subtitle={
        <span className="inline-flex items-center gap-1">
          Spoon Theory Planner 🥄
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block" onClick={() => setShowSpoonDialog(true)} />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
                <p className="font-semibold mb-1">What is Spoon Theory?</p>
                <p>Created by Christine Miserandino, it explains life with chronic illness. Each day you start with limited "spoons" of energy — every activity costs spoons. When they're gone, you're done for the day.</p>
                <button onClick={() => setShowSpoonDialog(true)} className="mt-1.5 text-primary hover:underline font-medium">Learn more →</button>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={showSpoonDialog} onOpenChange={setShowSpoonDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display">
                  <span className="text-2xl">🥄</span> The Spoon Theory
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The <span className="font-semibold text-foreground">Spoon Theory</span> was written by Christine Miserandino in 2003 to help her best friend understand what it's like to live with Lupus — and it has since become a widely-used metaphor across all chronic illness communities.
                </p>
                <p>
                  Imagine you wake up each morning with a fixed number of spoons. Every task — getting dressed, cooking, working, socializing — costs one or more spoons. Healthy people may feel like they have an unlimited supply, but for someone with a chronic illness, the supply is small and unpredictable.
                </p>
                <p>
                  Once your spoons are gone, you're done. Pushing beyond your limit means borrowing from tomorrow's supply, often leading to flare-ups and prolonged fatigue.
                </p>
                <p>
                  This planner helps you <span className="font-semibold text-foreground">visualize and budget your energy</span> so you can make intentional choices about how to spend your spoons each day.
                </p>
                <a
                  href="https://butyoudontlooksick.com/articles/written-by-christine/the-spoon-theory/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Read the original essay by Christine Miserandino
                </a>
              </div>
            </DialogContent>
          </Dialog>
        </span>
      } showBack />
      <PullToRefresh onRefresh={async () => { const qc = queryClient; await qc.invalidateQueries({ queryKey: ["energy-budget"] }); await qc.invalidateQueries({ queryKey: ["energy-activities"] }); }} className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">

        {/* Spoon meter */}
        <div className="rounded-xl bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {remaining > totalSpoons * 0.5 ? (
                <Battery className="h-5 w-5 text-green-500" />
              ) : remaining > totalSpoons * 0.2 ? (
                <BatteryWarning className="h-5 w-5 text-yellow-500" />
              ) : (
                <BatteryLow className="h-5 w-5 text-red-500" />
              )}
              <span className="font-display text-lg font-semibold text-foreground">
                {remaining} spoon{remaining !== 1 ? "s" : ""} remaining
              </span>
            </div>
            {editingSpoons ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = Math.max(1, totalSpoons - 1);
                    updateBudget.mutate({ id: budget.id, total_spoons: next });
                    localStorage.setItem(SPOON_KEY, String(next));
                  }}
                  className="rounded-full bg-secondary p-1 hover:bg-muted active:scale-95 transition-all"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-semibold text-foreground min-w-[2ch] text-center">{totalSpoons}</span>
                <button
                  onClick={() => {
                    const next = Math.min(20, totalSpoons + 1);
                    updateBudget.mutate({ id: budget.id, total_spoons: next });
                    localStorage.setItem(SPOON_KEY, String(next));
                  }}
                  className="rounded-full bg-secondary p-1 hover:bg-muted active:scale-95 transition-all"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditingSpoons(false)}
                  className="rounded-full bg-primary p-1 text-primary-foreground ml-1 active:scale-95 transition-all"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingSpoons(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {plannedSpoons}/{totalSpoons} planned
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${overBudget ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Visual spoons */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: totalSpoons }).map((_, i) => (
              <span key={i} className={`text-base transition-opacity ${i < plannedSpoons ? "opacity-30" : "opacity-100"}`}>
                🥄
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            Each spoon = a unit of energy. Activities cost spoons — when they're gone, it's time to rest.
          </p>

          {overBudget && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              ⚠️ You've exceeded your energy budget. Consider resting or postponing activities.
            </p>
          )}
          {!overBudget && remaining <= 2 && remaining > 0 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Running low — pace yourself for the rest of the day.
            </p>
          )}
          {plannedSpoons > totalSpoons && usedSpoons <= totalSpoons && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚡ Planned activities ({plannedSpoons} spoons) exceed your budget. Consider removing some.
            </p>
          )}
        </div>

        {/* Activities */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">Today's Activities</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Activity name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    maxLength={60}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Spoons:</span>
                      <button onClick={() => setNewCost(Math.max(0, newCost - 1))} className="rounded bg-secondary p-1 hover:bg-muted">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[2ch] text-center text-sm font-semibold">{newCost}</span>
                      <button onClick={() => setNewCost(Math.min(10, newCost + 1))} className="rounded bg-secondary p-1 hover:bg-muted">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={handleAddActivity}
                      disabled={!newName.trim() || addActivity.isPending}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      Add
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {showPresets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Quick add presets
                  </button>

                  {showPresets && (
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_ACTIVITIES.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => handleAddPreset(p)}
                          className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-foreground hover:bg-muted active:scale-95 transition-all"
                        >
                          {p.name} ({p.cost}🥄)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Frequent activities suggestion */}
          {frequentActivities.length > 0 && activities.length === 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Star className="h-3 w-3" /> Your frequent activities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {frequentActivities.map((fa) => (
                  <button
                    key={fa.name}
                    onClick={() => handleAddPreset({ name: fa.name, cost: fa.cost })}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-foreground hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    {fa.name} ({fa.cost}🥄)
                  </button>
                ))}
              </div>
            </div>
          )}

          {activities.length === 0 && frequentActivities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activities planned yet. Tap + to add your first activity.
            </p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedActivities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {sortedActivities.map((activity) => (
                  <SortableActivityRow
                    key={activity.id}
                    activity={activity}
                    onToggle={() => toggleActivity.mutate({ id: activity.id, completed: !activity.completed })}
                    onDelete={() => {
                      const snapshot = { budget_id: activity.budget_id, name: activity.name, spoon_cost: activity.spoon_cost, completed: activity.completed, sort_order: activity.sort_order };
                      deleteActivity.mutate(activity.id, {
                        onSuccess: () => {
                          toast(`"${snapshot.name}" deleted`, {
                            action: {
                              label: "Undo",
                              onClick: () => restoreActivity.mutate(snapshot),
                            },
                            duration: 5000,
                          });
                        },
                      });
                    }}
                    onUpdateCost={(cost) => updateActivityCost.mutate({ id: activity.id, spoon_cost: cost })}
                    editingCostId={editingCostId}
                    setEditingCostId={setEditingCostId}
                  />
                ))}
                {activities.length > 0 && !swipeHintDismissed && (
                  <p
                    className="mt-1 text-center text-[11px] text-muted-foreground/60 animate-fade-in cursor-pointer select-none"
                    onClick={() => {
                      localStorage.setItem("hint_energy_swipe_used", "1");
                      setSwipeHintDismissed(true);
                    }}
                  >
                    ← Swipe left to delete · drag ≡ to reorder · tap to dismiss
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
          {activities.length > 0 && (
            <div className="flex items-center justify-between pt-1 px-1">
              <p className="text-xs text-muted-foreground">
                {activities.filter(a => a.completed).length} of {activities.length} done
              </p>
              {activities.filter(a => a.completed).length > 0 && (
                <button
                  onClick={() => setShowClearCompleted(true)}
                  className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear completed
                </button>
              )}
            </div>
          )}
        </div>

        {/* Overexertion Alert */}
        <OverexertionAlert
          plannedSpoons={plannedSpoons}
          totalSpoons={totalSpoons}
          history={history}
        />

        {/* Appointment Import */}
        <AppointmentImport
          budgetId={budget.id}
          activities={activities}
          onImport={(name, cost) => handleAddPreset({ name, cost })}
        />

        {/* Rest Buffer Suggestion */}
        <RestBufferSuggestion totalSpoons={totalSpoons} plannedSpoons={plannedSpoons} />

        {/* Weekly Trends Chart */}
        <WeeklyTrendsChart history={history} />

        {/* Fatigue Correlation */}
        <FatigueCorrelation history={history} />

        {/* Weekly Consistency */}
        <WeeklyConsistency history={history} />

        {/* End of Day Reflection */}
        <EndOfDayReflection
          totalSpoons={totalSpoons}
          usedSpoons={usedSpoons}
          activitiesCount={activities.length}
        />

        {/* 7-day history */}
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="font-display text-sm font-semibold text-foreground">7-Day History</h3>
            {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {history.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No history yet.</p>
                  )}
                  {history.map((day: any) => {
                    const dayPct = Math.min((day.used / day.total_spoons) * 100, 100);
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">
                          {format(new Date(day.date + "T12:00:00"), "EEE d")}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              day.used > day.total_spoons ? "bg-destructive" : "bg-primary"
                            }`}
                            style={{ width: `${dayPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {day.used}/{day.total_spoons}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tip card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Pacing Tip</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Try alternating high-energy tasks with rest periods. If you consistently run out of spoons, consider adjusting your daily budget or breaking large tasks into smaller ones.
              </p>
            </div>
          </div>
        </div>
      </PullToRefresh>

      <AlertDialog open={showClearCompleted} onOpenChange={setShowClearCompleted}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear completed activities?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {completedActivities.length} completed activit{completedActivities.length === 1 ? "y" : "ies"} from today's plan. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCompleted}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnergyBudgetPage;
