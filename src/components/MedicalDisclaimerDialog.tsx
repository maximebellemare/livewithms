import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface MedicalDisclaimerDialogProps {
  trigger?: React.ReactNode;
  triggerClassName?: string;
}

const MedicalDisclaimerDialog = ({ trigger, triggerClassName }: MedicalDisclaimerDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={triggerClassName ?? "text-muted-foreground/50 hover:text-primary/70 transition-colors cursor-pointer"}>
        {trigger ?? "⚕️ Not medical advice"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">⚕️ Medical Disclaimer</DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2 text-sm leading-relaxed">
              <p>
                <strong>LiveWithMS</strong> is designed as a personal wellness companion and is <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <p>
                Always seek the advice of your neurologist or other qualified healthcare provider with any questions you may have regarding your condition. Never disregard professional medical advice or delay seeking it because of something you have read or tracked in this app.
              </p>
              <p>
                Symptom tracking, insights, and educational content provided by this app are for <strong>informational purposes only</strong> and should not be used to make medical decisions.
              </p>
              <p className="text-muted-foreground text-xs">
                If you are experiencing a medical emergency, call your local emergency number immediately.
              </p>
              <p className="pt-1">
                <a href="/privacy" onClick={() => setOpen(false)} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors text-xs font-medium">Learn more →</a>
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MedicalDisclaimerDialog;
