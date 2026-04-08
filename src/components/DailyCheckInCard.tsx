import DailyCheckInFlow from "@/components/DailyCheckInFlow";
import { CheckInMood } from "@/hooks/useDailyCheckIn";

const MOOD_EMOJI: Record<CheckInMood, string> = {
  good: "😊",
  okay: "😐",
  struggling: "😞",
  exhausted: "😴",
};

const MOOD_LABEL: Record<CheckInMood, string> = {
  good: "Good",
  okay: "Okay",
  struggling: "Struggling",
  exhausted: "Exhausted",
};

interface Props {
  checkIn: { mood: CheckInMood; aiResponse: string } | null;
  onComplete: (mood: CheckInMood) => void;
}

/** Persistent card on Today page — shows summary or lets user check in */
const DailyCheckInCard = ({ checkIn, onComplete }: Props) => {
  if (checkIn) {
    return (
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 space-y-2 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{MOOD_EMOJI[checkIn.mood]}</span>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Today's check-in</p>
            <p className="text-sm font-medium text-foreground">Feeling {MOOD_LABEL[checkIn.mood].toLowerCase()}</p>
          </div>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed italic">"{checkIn.aiResponse}"</p>
      </div>
    );
  }

  return <DailyCheckInFlow onComplete={onComplete} variant="card" />;
};

export default DailyCheckInCard;
