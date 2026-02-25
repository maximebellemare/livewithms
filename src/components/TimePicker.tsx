import { useState, useRef, useEffect } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // "HH:mm" or ""
  onChange: (value: string) => void;
  className?: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");

export default function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse value into hour (12h), minute, period
  const parsed = value ? value.split(":").map(Number) : [null, null];
  const hour24 = parsed[0];
  const minute = parsed[1] ?? 0;
  const period = hour24 !== null ? (hour24 >= 12 ? "PM" : "AM") : "AM";
  const hour12 = hour24 !== null ? (hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24) : 12;

  const [h, setH] = useState(hour12);
  const [m, setM] = useState(minute);
  const [p, setP] = useState<"AM" | "PM">(period as "AM" | "PM");

  // Sync when value changes externally
  useEffect(() => {
    if (value) {
      const [hh, mm] = value.split(":").map(Number);
      setH(hh === 0 ? 12 : hh > 12 ? hh - 12 : hh);
      setM(mm);
      setP(hh >= 12 ? "PM" : "AM");
    }
  }, [value]);

  const commit = (hour: number, min: number, per: "AM" | "PM") => {
    let h24 = hour === 12 ? 0 : hour;
    if (per === "PM") h24 += 12;
    onChange(`${pad(h24)}:${pad(min)}`);
  };

  const incH = () => { const next = h >= 12 ? 1 : h + 1; setH(next); commit(next, m, p); };
  const decH = () => { const next = h <= 1 ? 12 : h - 1; setH(next); commit(next, m, p); };
  const incM = () => { const next = m >= 55 ? 0 : m + 5; setM(next); commit(h, next, p); };
  const decM = () => { const next = m <= 0 ? 55 : m - 5; setM(next); commit(h, next, p); };
  const toggleP = () => { const next = p === "AM" ? "PM" : "AM"; setP(next); commit(h, m, next); };

  const displayText = value
    ? `${h}:${pad(m)} ${p}`
    : "--:-- --";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span>{displayText}</span>
          <Clock className="h-4 w-4 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4 pointer-events-auto bg-white dark:bg-card border shadow-elevated rounded-xl"
        align="start"
      >
        <div className="flex items-center gap-3">
          {/* Hour */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={incH}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="text-2xl font-semibold w-10 text-center tabular-nums text-foreground dark:text-foreground">
              {pad(h)}
            </span>
            <button
              type="button"
              onClick={decH}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <span className="text-2xl font-semibold text-foreground dark:text-foreground">:</span>

          {/* Minute */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={incM}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="text-2xl font-semibold w-10 text-center tabular-nums text-foreground dark:text-foreground">
              {pad(m)}
            </span>
            <button
              type="button"
              onClick={decM}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={toggleP}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="text-lg font-semibold w-10 text-center text-primary">
              {p}
            </span>
            <button
              type="button"
              onClick={toggleP}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
