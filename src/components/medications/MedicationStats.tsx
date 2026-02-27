import { useMemo } from "react";
import { format } from "date-fns";
import { Pill, TrendingUp, CalendarCheck, Activity } from "lucide-react";
import { DbMedication, useDbMedicationLogs } from "@/hooks/useMedications";
import { useMedStreak } from "@/hooks/useMedStreak";

interface MedicationStatsProps {
  medications: DbMedication[];
}

const MedicationStats = ({ medications }: MedicationStatsProps) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayLogs = [] } = useDbMedicationLogs(today, today);
  const streak = useMedStreak();

  const stats = useMemo(() => {
    const active = medications.filter((m) => m.active);
    const dailyMeds = active.filter((m) => m.schedule_type === "daily");
    const totalDosesToday = dailyMeds.reduce((sum, m) => sum + (m.times_per_day || 1), 0);
    const takenToday = todayLogs.filter((l) => l.status === "taken").length;
    const adherence = totalDosesToday > 0 ? Math.round((takenToday / totalDosesToday) * 100) : 0;

    return {
      active: active.length,
      adherence: Math.min(adherence, 100),
      streak,
      takenToday,
      totalDosesToday,
    };
  }, [medications, todayLogs, streak]);

  if (medications.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3">
          <Pill className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">{stats.active}</span>
          <span className="text-[10px] text-muted-foreground">Active Meds</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">{stats.adherence}%</span>
          <span className="text-[10px] text-muted-foreground">Today</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">{stats.streak}</span>
          <span className="text-[10px] text-muted-foreground">Day Streak</span>
        </div>
      </div>

      {stats.totalDosesToday > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Today's progress</span>
            <span>{stats.takenToday}/{stats.totalDosesToday} doses</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stats.adherence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationStats;
