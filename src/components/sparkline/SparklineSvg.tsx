import type { PlotPoint } from "./types";

const W = 200;
const H = 36;
const PAD = 4;

interface SparklineSvgProps {
  plotPoints: PlotPoint[];
  height: number;
  maxY: number;
  lowerIsBetter: boolean;
  lineColor: string;
  fillColor: string;
  colorFn: (value: number) => string;
}

export default function SparklineSvg({
  plotPoints,
  height,
  maxY,
  lowerIsBetter,
  lineColor,
  fillColor,
  colorFn,
}: SparklineSvgProps) {
  const toSvgX = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const toSvgY = (v: number) =>
    lowerIsBetter
      ? PAD + (v / maxY) * (H - PAD * 2)
      : PAD + ((maxY - v) / maxY) * (H - PAD * 2);

  const midY = maxY / 2;

  const svgLinePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <line
        x1={PAD} y1={toSvgY(midY)} x2={W - PAD} y2={toSvgY(midY)}
        stroke="hsl(var(--border))" strokeWidth="0.8" strokeDasharray="3 3"
      />
      {plotPoints.length >= 2 && (
        <polyline
          points={[
            `${toSvgX(plotPoints[0].x)},${H - PAD}`,
            ...plotPoints.map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`),
            `${toSvgX(plotPoints[plotPoints.length - 1].x)},${H - PAD}`,
          ].join(" ")}
          fill={fillColor}
          stroke="none"
        />
      )}
      {plotPoints.length >= 2 && (
        <polyline
          points={svgLinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {plotPoints.map((p) => (
        <circle
          key={p.date}
          cx={toSvgX(p.x)}
          cy={toSvgY(p.value)}
          r="2.5"
          fill={colorFn(p.value)}
          stroke="hsl(var(--card))"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
