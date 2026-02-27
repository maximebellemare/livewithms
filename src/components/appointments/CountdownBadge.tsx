import { differenceInDays, parseISO, isToday, isTomorrow } from "date-fns";

interface CountdownBadgeProps {
  date: string;
}

const CountdownBadge = ({ date }: CountdownBadgeProps) => {
  const parsed = parseISO(date);
  const today = new Date();
  const diff = differenceInDays(parsed, today);

  if (diff < 0) {
    return (
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Past
      </span>
    );
  }

  if (isToday(parsed)) {
    return (
      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary animate-pulse">
        Today
      </span>
    );
  }

  if (isTomorrow(parsed)) {
    return (
      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
        Tomorrow
      </span>
    );
  }

  if (diff <= 7) {
    return (
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
        In {diff} days
      </span>
    );
  }

  return null;
};

export default CountdownBadge;
