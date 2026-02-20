import { useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { useRelapses, useCreateRelapse, useUpdateRelapse, useDeleteRelapse, Relapse } from "@/hooks/useRelapses";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Zap,
  Plus,
  Calendar as CalendarIcon,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Heart,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  { value: "moderate", label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { value: "severe", label: "Severe", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  { value: "critical", label: "Critical", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
];

const RELAPSE_SYMPTOMS = [
  "Vision loss", "Double vision", "Numbness", "Tingling", "Weakness",
  "Balance issues", "Dizziness", "Fatigue", "Bladder issues", "Bowel issues",
  "Cognitive fog", "Speech difficulty", "Swallowing difficulty", "Pain", "Spasticity",
];

const TRIGGER_OPTIONS = [
  "Stress", "Heat", "Infection", "Lack of sleep", "Overexertion",
  "Illness", "Unknown",
];

const MultiSelect = ({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => {
      const active = selected.includes(opt);
      return (
        <button
          key={opt}
          type="button"
          onClick={() =>
            onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])
          }
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            active
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const DatePickerField = ({
  label,
  date,
  onChange,
  placeholder = "Pick a date",
}: {
  label: string;
  date: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40",
            !date && "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          defaultMonth={date || new Date()}
          disabled={(d) => d > new Date()}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={1960}
          toYear={new Date().getFullYear()}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
);

// Relapse form for creating/editing
const RelapseForm = ({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Relapse>;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    initial?.start_date ? parseISO(initial.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initial?.end_date ? parseISO(initial.end_date) : undefined
  );
  const [severity, setSeverity] = useState(initial?.severity ?? "moderate");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [triggers, setTriggers] = useState<string[]>(initial?.triggers ?? []);
  const [treatment, setTreatment] = useState(initial?.treatment ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isRecovered, setIsRecovered] = useState(initial?.is_recovered ?? false);

  const handleSubmit = () => {
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }
    if (symptoms.length === 0) {
      toast.error("Select at least one symptom");
      return;
    }
    onSave({
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      severity,
      symptoms,
      triggers,
      treatment: treatment || null,
      notes: notes || null,
      is_recovered: isRecovered,
    });
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <DatePickerField label="Start Date *" date={startDate} onChange={setStartDate} />
        <DatePickerField
          label="End Date"
          date={endDate}
          onChange={setEndDate}
          placeholder="Ongoing"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Severity</label>
        <div className="flex gap-1.5">
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                severity === s.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Symptoms *</label>
        <MultiSelect options={RELAPSE_SYMPTOMS} selected={symptoms} onChange={setSymptoms} />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Possible Triggers</label>
        <MultiSelect options={TRIGGER_OPTIONS} selected={triggers} onChange={setTriggers} />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Treatment</label>
        <input
          type="text"
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          placeholder="e.g. IV steroids, oral prednisone..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did this relapse affect your daily life?"
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <button
          type="button"
          onClick={() => setIsRecovered(!isRecovered)}
          className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
            isRecovered
              ? "bg-primary border-primary"
              : "bg-background border-border"
          }`}
        >
          {isRecovered && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>
        <span className="text-sm text-foreground">Fully recovered</span>
      </label>

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
        >
          {saving ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Save
        </button>
      </div>
    </div>
  );
};

// Single relapse card
const RelapseCard = ({
  relapse,
  onEdit,
  onDelete,
}: {
  relapse: Relapse;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const severityInfo = SEVERITY_OPTIONS.find((s) => s.value === relapse.severity) ?? SEVERITY_OPTIONS[1];
  const duration = relapse.end_date
    ? differenceInDays(parseISO(relapse.end_date), parseISO(relapse.start_date))
    : differenceInDays(new Date(), parseISO(relapse.start_date));

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${severityInfo.color}`} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {format(parseISO(relapse.start_date), "MMM d, yyyy")}
              {relapse.end_date && ` – ${format(parseISO(relapse.end_date), "MMM d, yyyy")}`}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityInfo.bg} ${severityInfo.color}`}>
                {severityInfo.label}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration} day{duration !== 1 ? "s" : ""}
              </span>
              {relapse.is_recovered && (
                <span className="text-[11px] text-green-400 flex items-center gap-0.5">
                  <Heart className="h-3 w-3" /> Recovered
                </span>
              )}
              {!relapse.is_recovered && !relapse.end_date && (
                <span className="text-[11px] text-yellow-400 flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3" /> Ongoing
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {relapse.symptoms.slice(0, expanded ? undefined : 4).map((s) => (
          <span
            key={s}
            className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary"
          >
            {s}
          </span>
        ))}
        {!expanded && relapse.symptoms.length > 4 && (
          <span className="text-[11px] text-muted-foreground py-0.5">
            +{relapse.symptoms.length - 4} more
          </span>
        )}
      </div>

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-border">
          {relapse.triggers && relapse.triggers.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Triggers</p>
              <div className="flex flex-wrap gap-1">
                {relapse.triggers.map((t) => (
                  <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {relapse.treatment && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Treatment</p>
              <p className="text-sm text-foreground">{relapse.treatment}</p>
            </div>
          )}
          {relapse.notes && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Notes</p>
              <p className="text-sm text-foreground">{relapse.notes}</p>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this relapse?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this relapse entry. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
};

const RelapsesPage = () => {
  const { data: relapses, isLoading } = useRelapses();
  const createRelapse = useCreateRelapse();
  const updateRelapse = useUpdateRelapse();
  const deleteRelapse = useDeleteRelapse();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingRelapse = relapses?.find((r) => r.id === editingId);

  const handleCreate = async (data: any) => {
    try {
      await createRelapse.mutateAsync(data);
      toast.success("Relapse logged");
      setShowForm(false);
    } catch {
      toast.error("Failed to save relapse");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingId) return;
    try {
      await updateRelapse.mutateAsync({ id: editingId, ...data });
      toast.success("Relapse updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update relapse");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRelapse.mutateAsync(id);
      toast.success("Relapse deleted");
    } catch {
      toast.error("Failed to delete relapse");
    }
  };

  const totalRelapses = relapses?.length ?? 0;
  const activeRelapses = relapses?.filter((r) => !r.is_recovered && !r.end_date).length ?? 0;

  if (isLoading) {
    return (
      <>
        <PageHeader title="Relapses" subtitle="Track your MS flare-ups" />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Relapses" subtitle="Track your MS flare-ups" />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in pb-28">
        {/* Summary strip */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-card p-3 shadow-soft text-center">
            <p className="text-2xl font-bold text-foreground">{totalRelapses}</p>
            <p className="text-[11px] text-muted-foreground">Total Relapses</p>
          </div>
          <div className="flex-1 rounded-xl bg-card p-3 shadow-soft text-center">
            <p className="text-2xl font-bold text-foreground">{activeRelapses}</p>
            <p className="text-[11px] text-muted-foreground">Ongoing</p>
          </div>
          {relapses && relapses.length > 0 && (
            <div className="flex-1 rounded-xl bg-card p-3 shadow-soft text-center">
              <p className="text-2xl font-bold text-foreground">
                {format(parseISO(relapses[0].start_date), "MMM yyyy")}
              </p>
              <p className="text-[11px] text-muted-foreground">Last Relapse</p>
            </div>
          )}
        </div>

        {/* Add button */}
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log a Relapse
          </button>
        )}

        {/* Create form */}
        {showForm && (
          <RelapseForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={createRelapse.isPending}
          />
        )}

        {/* Edit form */}
        {editingId && editingRelapse && (
          <RelapseForm
            initial={editingRelapse}
            onSave={handleUpdate}
            onCancel={() => setEditingId(null)}
            saving={updateRelapse.isPending}
          />
        )}

        {/* Relapse list */}
        {relapses && relapses.length > 0 ? (
          <div className="space-y-3">
            {relapses.map((relapse) =>
              editingId === relapse.id ? null : (
                <RelapseCard
                  key={relapse.id}
                  relapse={relapse}
                  onEdit={() => {
                    setShowForm(false);
                    setEditingId(relapse.id);
                  }}
                  onDelete={() => handleDelete(relapse.id)}
                />
              )
            )}
          </div>
        ) : (
          !showForm && (
            <div className="rounded-xl bg-card p-8 shadow-soft text-center space-y-2">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No relapses logged yet</p>
              <p className="text-xs text-muted-foreground">
                Tracking relapses helps you and your neurologist spot patterns and optimize treatment.
              </p>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default RelapsesPage;
