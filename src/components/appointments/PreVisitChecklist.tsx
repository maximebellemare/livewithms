import { useState } from "react";
import { Check, Plus, X, ListChecks } from "lucide-react";
import { AppointmentType } from "@/lib/appointments";

interface ChecklistItem {
  text: string;
  checked: boolean;
}

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  neurologist: [
    "Bring insurance card & ID",
    "List of current medications",
    "Write down questions to ask",
    "Note any new or changed symptoms",
    "Bring recent MRI results if available",
  ],
  mri: [
    "Remove all metal jewelry/accessories",
    "Wear comfortable clothing (no metal)",
    "Arrive 15 minutes early",
    "Bring previous MRI CDs if available",
    "Fast if contrast dye is required",
  ],
  labs: [
    "Fast for 12 hours if required",
    "Bring lab order/referral",
    "Stay hydrated (water is OK)",
    "Bring insurance card",
    "Wear short sleeves for easy access",
  ],
  therapy: [
    "Review goals from last session",
    "Note topics to discuss",
    "Bring journal if applicable",
    "Complete any assigned exercises",
  ],
  custom: [
    "Bring insurance card & ID",
    "Write down questions to ask",
  ],
};

interface PreVisitChecklistProps {
  type: string;
  checklist: ChecklistItem[];
  onChange: (checklist: ChecklistItem[]) => void;
  readonly?: boolean;
}

const PreVisitChecklist = ({ type, checklist, onChange, readonly }: PreVisitChecklistProps) => {
  const [newItem, setNewItem] = useState("");
  const [expanded, setExpanded] = useState(false);

  const effectiveChecklist = checklist.length > 0
    ? checklist
    : (DEFAULT_CHECKLISTS[type] || DEFAULT_CHECKLISTS.custom).map((text) => ({
        text,
        checked: false,
      }));

  const initializeIfNeeded = () => {
    if (checklist.length === 0) {
      onChange(effectiveChecklist);
    }
  };

  const toggleItem = (index: number) => {
    initializeIfNeeded();
    const updated = [...effectiveChecklist];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    onChange(updated);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    initializeIfNeeded();
    onChange([...effectiveChecklist, { text: newItem.trim(), checked: false }]);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    initializeIfNeeded();
    onChange(effectiveChecklist.filter((_, i) => i !== index));
  };

  const completedCount = effectiveChecklist.filter((i) => i.checked).length;
  const totalCount = effectiveChecklist.length;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Pre-Visit Checklist</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
          <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="space-y-1.5 animate-fade-in">
          {effectiveChecklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
              <button
                onClick={() => !readonly && toggleItem(idx)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                  item.checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:border-primary/50"
                }`}
                disabled={readonly}
              >
                {item.checked && <Check className="h-3 w-3" />}
              </button>
              <span
                className={`flex-1 text-xs transition-all ${
                  item.checked ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.text}
              </span>
              {!readonly && (
                <button
                  onClick={() => removeItem(idx)}
                  className="opacity-0 group-hover:opacity-100 rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {!readonly && (
            <div className="flex gap-2 pt-1">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Add custom item..."
                className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={addItem}
                disabled={!newItem.trim()}
                className="rounded-lg bg-primary p-1.5 text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreVisitChecklist;
