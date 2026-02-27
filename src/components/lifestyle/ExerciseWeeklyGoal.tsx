import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Target, Flame, Settings, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface Props {
  logs: ExerciseLog[];
}

export default function ExerciseWeeklyGoal({ logs }: Props) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const weekGoal = (profile as any)?.weekly_exercise_goal_minutes ?? 150;

  const weeklyMinutes = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return logs
      .filter(l => {
        const d = parseISO(l.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      })
      .reduce((sum, l) => sum + l.duration_minutes, 0);
  }, [logs]);

  const pct = Math.min(100, (weeklyMinutes / weekGoal) * 100);
  const isComplete = weeklyMinutes >= weekGoal;

  const saveGoal = async () => {
    const val = parseInt(goalInput);
    if (isNaN(val) || val < 10 || val > 600) {
      toast.error("Enter a goal between 10–600 minutes");
      return;
    }
    try {
      await updateProfile.mutateAsync({ weekly_exercise_goal_minutes: val } as any);
      toast.success("Goal updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">Weekly Goal</h3>
        </div>
        <button onClick={() => { setEditing(!editing); setGoalInput(weekGoal.toString()); }} className="text-muted-foreground hover:text-primary">
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {editing ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Minutes per week</label>
            <input
              type="number"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
              min={10} max={600}
            />
          </div>
          <button onClick={saveGoal} disabled={updateProfile.isPending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{weeklyMinutes}</span>
            <span className="text-sm text-muted-foreground">/ {weekGoal} min</span>
            {isComplete && <Flame className="h-4 w-4 text-amber-500" />}
          </div>
          <Progress value={pct} className="h-2.5" />
          <p className="text-[11px] text-muted-foreground">
            {isComplete
              ? "🎉 Weekly goal reached! Great job staying active."
              : `${weekGoal - weeklyMinutes} minutes remaining this week`}
          </p>
        </>
      )}
    </div>
  );
}
