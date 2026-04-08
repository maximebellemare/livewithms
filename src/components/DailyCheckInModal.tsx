import { Dialog, DialogContent } from "@/components/ui/dialog";
import DailyCheckInFlow from "@/components/DailyCheckInFlow";
import { CheckInMood, CheckInData } from "@/hooks/useDailyCheckIn";

interface DailyCheckInModalProps {
  open: boolean;
  onComplete: (mood: CheckInMood) => CheckInData;
  onDismiss: () => void;
}

const DailyCheckInModal = ({ open, onComplete, onDismiss }: DailyCheckInModalProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
    <DialogContent className="max-w-[360px] rounded-3xl p-7 gap-0 border-primary/8 shadow-xl bg-card">
      <DailyCheckInFlow
        onComplete={onComplete}
        onDismiss={onDismiss}
        variant="modal"
      />
    </DialogContent>
  </Dialog>
);

export default DailyCheckInModal;
