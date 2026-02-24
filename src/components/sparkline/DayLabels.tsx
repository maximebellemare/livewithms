import { format, parseISO } from "date-fns";

interface DayLabelsProps {
  days: string[];
  dataKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  byDate: Record<string, any>;
}

export default function DayLabels({ days, dataKey, byDate }: DayLabelsProps) {
  return (
    <div className="flex justify-between px-1">
      {days.map((date) => {
        const hasData = byDate[date]?.[dataKey] != null;
        return (
          <span
            key={date}
            className="text-[8px] leading-none"
            style={{ color: hasData ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground) / 0.4)" }}
          >
            {format(parseISO(date), "EEE")[0]}
          </span>
        );
      })}
    </div>
  );
}
