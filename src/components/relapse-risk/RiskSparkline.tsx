import { useState } from "react";

interface RiskSparklineProps {
  weeklyScores: number[];
}

export default function RiskSparkline({ weeklyScores }: RiskSparklineProps) {
  const [activeDot, setActiveDot] = useState<number | null>(null);

  if (weeklyScores.length < 2) return null;

  const max = Math.max(...weeklyScores, 20);
  const lastScore = weeklyScores[weeklyScores.length - 1];
  const strokeColor =
    lastScore >= 60 ? "hsl(0, 72%, 51%)" :
    lastScore >= 35 ? "hsl(25, 85%, 50%)" :
    lastScore >= 15 ? "hsl(35, 80%, 50%)" : "hsl(145, 45%, 45%)";
  const weekLabels = weeklyScores.map((_, i) => {
    const weeksAgo = weeklyScores.length - 1 - i;
    return weeksAgo === 0 ? "This week" : weeksAgo === 1 ? "Last week" : `${weeksAgo}w ago`;
  });

  const len = weeklyScores.length;

  return (
    <div className="mb-2">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 120 54"
            className="h-12 w-full max-w-[180px] cursor-pointer"
            preserveAspectRatio="none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = (e.clientX - rect.left) / rect.width;
              let closest = 0;
              let minDist = Infinity;
              weeklyScores.forEach((_, i) => {
                const dotX = i / (len - 1);
                const dist = Math.abs(clickX - dotX);
                if (dist < minDist) { minDist = dist; closest = i; }
              });
              setActiveDot(activeDot === closest ? null : closest);
            }}
          >
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <polygon
              points={[
                ...weeklyScores.map((s, i) => {
                  const x = (i / (len - 1)) * 112 + 4;
                  const y = 34 - (s / max) * 28;
                  return `${x},${y}`;
                }),
                `${((len - 1) / (len - 1)) * 112 + 4},38`,
                `4,38`,
              ].join(" ")}
              fill="url(#sparkFill)"
            />
            {/* Line */}
            <polyline
              points={weeklyScores.map((s, i) => {
                const x = (i / (len - 1)) * 112 + 4;
                const y = 34 - (s / max) * 28;
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {weeklyScores.map((s, i) => {
              const x = (i / (len - 1)) * 112 + 4;
              const y = 34 - (s / max) * 28;
              const isActive = activeDot === i;
              const isCurrent = i === len - 1;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? 5 : isCurrent ? 4 : 3}
                    fill={isActive || isCurrent ? strokeColor : "hsl(var(--muted-foreground))"}
                    opacity={isActive || isCurrent ? 1 : 0.5}
                    className="transition-all duration-200"
                  />
                  <text
                    x={x}
                    y={50}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: "8px" }}
                  >
                    {`W${i + 1}`}
                  </text>
                </g>
              );
            })}
          </svg>
          {activeDot !== null && activeDot < weeklyScores.length && (
            <div
              className="absolute -bottom-6 rounded bg-card border border-border px-1.5 py-0.5 shadow-md text-[9px] text-foreground font-medium whitespace-nowrap pointer-events-none z-10"
              style={{
                left: `${(activeDot / (len - 1)) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {weekLabels[activeDot]} · {weeklyScores[activeDot]}
            </div>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground whitespace-nowrap">4-week trend</span>
      </div>
    </div>
  );
}
