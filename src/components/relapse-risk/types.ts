import { DailyEntry } from "@/hooks/useEntries";
import { Shield, ShieldAlert, AlertTriangle } from "lucide-react";

export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export interface RiskResult {
  level: RiskLevel;
  score: number; // 0-100
  factors: string[];
}

export const RISK_CONFIG: Record<RiskLevel, {
  icon: typeof Shield;
  color: string;
  bg: string;
  border: string;
  label: string;
  emoji: string;
}> = {
  low: {
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Low Risk",
    emoji: "🛡️",
  },
  moderate: {
    icon: Shield,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    label: "Moderate",
    emoji: "⚠️",
  },
  elevated: {
    icon: ShieldAlert,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    label: "Elevated",
    emoji: "🔶",
  },
  high: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    label: "High Risk",
    emoji: "🔴",
  },
};
