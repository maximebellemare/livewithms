import { useHeatAlert } from "@/hooks/useHeatAlert";
import { Thermometer, Droplets, Wind } from "lucide-react";
import { Link } from "react-router-dom";

const riskColors = {
  moderate: "border-yellow-400/40 bg-yellow-50 dark:bg-yellow-950/30",
  high: "border-orange-400/40 bg-orange-50 dark:bg-orange-950/30",
  extreme: "border-red-400/40 bg-red-50 dark:bg-red-950/30",
};

const riskIcons = {
  moderate: "text-yellow-600 dark:text-yellow-400",
  high: "text-orange-600 dark:text-orange-400",
  extreme: "text-red-600 dark:text-red-400",
};

export default function HeatAlertCard() {
  const { data: weather, isLoading } = useHeatAlert();

  if (isLoading || !weather || !weather.isHot) return null;

  const risk = weather.riskLevel as "moderate" | "high" | "extreme";

  return (
    <div className={`rounded-xl border p-4 animate-fade-in ${riskColors[risk]}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${riskIcons[risk]}`}>
          <Thermometer className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Heat Alert</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {weather.message}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5" />
              {Math.round(weather.temperature)}°C
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3.5 w-3.5" />
              Feels {Math.round(weather.apparentTemperature)}°C
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              Stay hydrated
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Set your city in{" "}
        <Link to="/profile" className="underline underline-offset-2 hover:text-foreground">
          Profile Settings
        </Link>
      </p>
    </div>
  );
}
