import { TrendingUp } from "lucide-react";

interface RiskFactorsProps {
  factors: string[];
  isLow: boolean;
}

export default function RiskFactors({ factors, isLow }: RiskFactorsProps) {
  if (factors.length > 0) {
    return (
      <div className="space-y-0.5">
        {factors.map((f, i) => (
          <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5 flex-shrink-0" />
            {f}
          </p>
        ))}
      </div>
    );
  }

  if (isLow) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Your symptoms are stable — keep it up! 💪
      </p>
    );
  }

  return null;
}
