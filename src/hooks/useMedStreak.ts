import { useMemo } from "react";
import { subDays, format, eachDayOfInterval } from "date-fns";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";

/** Consecutive days of perfect daily medication adherence (up to 90 days back). */
export function useMedStreak() {
  const today = new Date();
  const startDate = format(subDays(today, 89), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");
  const { data: medications } = useDbMedications();
  const { data: logs } = useDbMedicationLogs(startDate, endDate);

  return useMemo(() => {
    const activeMeds = (medications ?? []).filter((m) => m.active && m.schedule_type === "daily");
    if (activeMeds.length === 0) return 0;

    const logsByDate = new Map<string, Set<string>>();
    for (const log of logs ?? []) {
      if (log.status === "taken") {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
        logsByDate.get(log.date)!.add(log.medication_id);
      }
    }

    const days = eachDayOfInterval({ start: subDays(today, 89), end: today }).reverse();
    let streak = 0;
    for (const d of days) {
      const dateStr = format(d, "yyyy-MM-dd");
      const taken = logsByDate.get(dateStr)?.size ?? 0;
      if (taken >= activeMeds.length) streak++;
      else break;
    }
    return streak;
  }, [medications, logs]);
}
