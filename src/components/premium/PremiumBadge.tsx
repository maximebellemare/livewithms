import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Tiny sparkle badge shown next to premium users' display names */
const PremiumBadge = () => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-1 py-0.5 ml-1">
          <Sparkles className="h-2.5 w-2.5 text-primary" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Premium member ✨
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default PremiumBadge;
