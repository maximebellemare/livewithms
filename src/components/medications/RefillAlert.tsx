import { useMemo } from "react";
import { differenceInDays, parseISO, format } from "date-fns";
import { Package, AlertCircle } from "lucide-react";
import { DbMedication } from "@/hooks/useMedications";

interface RefillAlertProps {
  medications: DbMedication[];
}

const RefillAlert = ({ medications }: RefillAlertProps) => {
  const alerts = useMemo(() => {
    const today = new Date();
    const result: { med: DbMedication; type: "low" | "refill_soon"; daysLeft: number; detail: string }[] = [];

    for (const med of medications) {
      if (!med.active) continue;

      // Check refill date
      if (med.refill_date) {
        const daysUntil = differenceInDays(parseISO(med.refill_date), today);
        if (daysUntil <= 7 && daysUntil >= 0) {
          result.push({
            med,
            type: "refill_soon",
            daysLeft: daysUntil,
            detail: daysUntil === 0 ? "Refill due today" : `Refill due in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
          });
        }
      }

      // Check supply count
      if (med.supply_count != null && med.schedule_type === "daily") {
        const dailyUse = (med.times_per_day || 1) * (med.pills_per_dose || 1);
        const daysOfSupply = dailyUse > 0 ? Math.floor(med.supply_count / dailyUse) : 999;
        if (daysOfSupply <= 14) {
          result.push({
            med,
            type: "low",
            daysLeft: daysOfSupply,
            detail: `~${daysOfSupply} day${daysOfSupply !== 1 ? "s" : ""} of supply left (${med.supply_count} ${med.supply_unit || "pills"})`,
          });
        }
      }
    }

    return result.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [medications]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2 animate-fade-in">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-amber-400" />
        Refill Alerts
      </p>
      {alerts.map((alert, idx) => (
        <div key={idx} className="flex items-center gap-2 rounded-lg bg-card/50 px-3 py-2">
          <AlertCircle className={`h-3.5 w-3.5 shrink-0 ${alert.daysLeft <= 3 ? "text-red-400" : "text-amber-400"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{alert.med.name}</p>
            <p className="text-[10px] text-muted-foreground">{alert.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RefillAlert;
