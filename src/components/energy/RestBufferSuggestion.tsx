import { Shield } from "lucide-react";

interface Props {
  totalSpoons: number;
  plannedSpoons: number;
}

export default function RestBufferSuggestion({ totalSpoons, plannedSpoons }: Props) {
  const buffer = 2;
  const safeLimit = totalSpoons - buffer;
  const showWarning = plannedSpoons > safeLimit && plannedSpoons <= totalSpoons;

  if (!showWarning) return null;

  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
      <div className="flex items-start gap-2.5">
        <Shield className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">Rest Buffer</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Consider keeping 2 spoons unplanned as a safety buffer for unexpected needs or if tasks take more energy than expected.
          </p>
        </div>
      </div>
    </div>
  );
}
