import { Dialog, DialogContent } from "@/components/ui/dialog";
import DailyCheckInFlow from "@/components/DailyCheckInFlow";
import { CheckInMood } from "@/hooks/useDailyCheckIn";

interface DailyCheckInModalProps {
  open: boolean;
  onComplete: (mood: CheckInMood) => void;
  onDismiss: () => void;
}

const DailyCheckInModal = ({ open, onComplete, onDismiss }: DailyCheckInModalProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
    <DialogContent className="max-w-sm rounded-2xl p-6 gap-0 border-primary/10">
      <DailyCheckInFlow
        onComplete={onComplete}
        onDismiss={onDismiss}
        variant="modal"
      />
    </DialogContent>
  </Dialog>
);

export default DailyCheckInModal;
