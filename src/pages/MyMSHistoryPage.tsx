import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useDbMedications } from "@/hooks/useMedications";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Pill,
  Target,
  Activity,
  Stethoscope,
  ChevronRight,
  Check,
  X,
  Calendar,
  User,
  CalendarHeart,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const MS_TYPES = ["RRMS", "PPMS", "SPMS", "CIS", "Unknown"];

const SYMPTOM_OPTIONS = [
  "Fatigue", "Pain", "Brain Fog", "Mobility Issues", "Spasticity",
  "Vision Problems", "Numbness/Tingling", "Bladder Issues",
  "Depression", "Anxiety", "Dizziness", "Heat Sensitivity",
];

const GOAL_OPTIONS = [
  "Better sleep", "More energy", "Improved mobility", "Stable mood",
  "Sharper cognition", "Reduce pain", "Stay active", "Manage stress",
];

const Section = ({
  icon: Icon,
  title,
  children,
  onEdit,
  editing,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  editing?: boolean;
}) => (
  <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {onEdit && !editing && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      )}
    </div>
    {children}
  </div>
);

const TagList = ({ items, emptyText }: { items: string[]; emptyText: string }) =>
  items.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {item}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-xs text-muted-foreground italic">{emptyText}</p>
  );

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

const MyMSHistoryPage = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: medications, isLoading: medsLoading } = useDbMedications();
  const updateProfile = useUpdateProfile();

  // Edit states
  const [editingDiagnosis, setEditingDiagnosis] = useState(false);
  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);

  // Form states
  const [msType, setMsType] = useState("");
  const [yearDiagnosed, setYearDiagnosed] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [diagnosisDate, setDiagnosisDate] = useState<Date | undefined>(undefined);

  const initDiagnosis = () => {
    setMsType(profile?.ms_type ?? "");
    setYearDiagnosed(profile?.year_diagnosed ?? "");
    setAgeRange(profile?.age_range ?? "");
    setDiagnosisDate(profile?.diagnosis_date ? parseISO(profile.diagnosis_date) : undefined);
    setEditingDiagnosis(true);
  };

  const initSymptoms = () => {
    setSymptoms(profile?.symptoms ?? []);
    setEditingSymptoms(true);
  };

  const initGoals = () => {
    setGoals(profile?.goals ?? []);
    setEditingGoals(true);
  };

  const saveDiagnosis = async () => {
    try {
      await updateProfile.mutateAsync({
        ms_type: msType || null,
        year_diagnosed: yearDiagnosed || null,
        age_range: ageRange || null,
        diagnosis_date: diagnosisDate ? format(diagnosisDate, "yyyy-MM-dd") : null,
      } as any);
      toast.success("Diagnosis info updated");
      setEditingDiagnosis(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const saveSymptoms = async () => {
    try {
      await updateProfile.mutateAsync({ symptoms } as any);
      toast.success("Symptom priorities updated");
      setEditingSymptoms(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const saveGoals = async () => {
    try {
      await updateProfile.mutateAsync({ goals } as any);
      toast.success("Goals updated");
      setEditingGoals(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const activeMeds = medications?.filter((m) => m.active) ?? [];
  const inactiveMeds = medications?.filter((m) => !m.active) ?? [];

  if (profileLoading || medsLoading) {
    return (
      <>
        <PageHeader title="My MS History" subtitle="Your diagnosis at a glance" showBack />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My MS History" subtitle="Your diagnosis at a glance" showBack />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in pb-28">
        {/* Diagnosis Summary */}
        <Section
          icon={Stethoscope}
          title="Diagnosis Summary"
          onEdit={initDiagnosis}
          editing={editingDiagnosis}
        >
          {editingDiagnosis ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">MS Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {MS_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMsType(t)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        msType === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Year Diagnosed</label>
                  <input
                    type="text"
                    value={yearDiagnosed}
                    onChange={(e) => setYearDiagnosed(e.target.value)}
                    placeholder="e.g. 2019"
                    maxLength={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Age Range</label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Select</option>
                    <option value="18-25">18–25</option>
                    <option value="26-35">26–35</option>
                    <option value="36-45">36–45</option>
                    <option value="46-55">46–55</option>
                    <option value="56-65">56–65</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exact Diagnosis Date (optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40",
                        !diagnosisDate && "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <CalendarHeart className="h-3.5 w-3.5" />
                        {diagnosisDate ? format(diagnosisDate, "MMMM d, yyyy") : "Pick a date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={diagnosisDate}
                      onSelect={setDiagnosisDate}
                      defaultMonth={diagnosisDate || new Date()}
                      disabled={(date) => date > new Date() || date < new Date("1960-01-01")}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1960}
                      toYear={new Date().getFullYear()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {diagnosisDate && (
                  <button
                    type="button"
                    onClick={() => setDiagnosisDate(undefined)}
                    className="mt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear date
                  </button>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingDiagnosis(false)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button
                  onClick={saveDiagnosis}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {profile?.ms_type || "Not set"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">
                    {profile?.year_diagnosed
                      ? `Diagnosed ${profile.year_diagnosed}`
                      : "Year not set"}
                  </span>
                  {profile?.year_diagnosed && (
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {new Date().getFullYear() - Number(profile.year_diagnosed)} yr{new Date().getFullYear() - Number(profile.year_diagnosed) !== 1 ? "s" : ""} ago
                    </span>
                  )}
                </div>
              </div>
              {profile?.age_range && (
                <div className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">Age {profile.age_range}</span>
                </div>
              )}
              {profile?.diagnosis_date && (
                <div className="flex items-center gap-1.5 text-sm">
                  <CalendarHeart className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">
                    Diagnosed {format(parseISO(profile.diagnosis_date), "MMMM d, yyyy")}
                  </span>
                  {(() => {
                    const dx = parseISO(profile.diagnosis_date);
                    const today = new Date();
                    const thisYearAnniversary = new Date(today.getFullYear(), dx.getMonth(), dx.getDate());
                    const diffDays = Math.ceil((thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return (
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                        🎗️ Today is your anniversary
                      </span>
                    );
                    if (diffDays > 0 && diffDays <= 30) return (
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                        🎗️ {diffDays} day{diffDays !== 1 ? "s" : ""} away
                      </span>
                    );
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Medications */}
        <Section icon={Pill} title="Medications">
          {activeMeds.length > 0 ? (
            <div className="space-y-2">
              {activeMeds.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: med.color || "hsl(var(--primary))" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {med.dosage && `${med.dosage} · `}
                      {med.schedule_type === "infusion"
                        ? `Every ${med.infusion_interval_months} months`
                        : med.schedule_type === "custom"
                        ? `${med.times_per_day}× daily`
                        : "Daily"}
                    </p>
                  </div>
                </div>
              ))}
              {inactiveMeds.length > 0 && (
                <p className="text-[11px] text-muted-foreground pt-1">
                  + {inactiveMeds.length} inactive medication{inactiveMeds.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No medications added yet</p>
          )}
          <Link
            to="/medications"
            className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>Manage Medications</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Section>

        {/* Symptom Priorities */}
        <Section
          icon={Activity}
          title="Symptom Priorities"
          onEdit={initSymptoms}
          editing={editingSymptoms}
        >
          {editingSymptoms ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select the symptoms you want to focus on tracking.
              </p>
              <MultiSelect
                options={SYMPTOM_OPTIONS}
                selected={symptoms}
                onChange={setSymptoms}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingSymptoms(false)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button
                  onClick={saveSymptoms}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          ) : (
            <TagList
              items={profile?.symptoms ?? []}
              emptyText="No symptom priorities set — tap Edit to add yours"
            />
          )}
        </Section>

        {/* Personal Goals */}
        <Section
          icon={Target}
          title="Personal Goals"
          onEdit={initGoals}
          editing={editingGoals}
        >
          {editingGoals ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                What matters most to you right now?
              </p>
              <MultiSelect
                options={GOAL_OPTIONS}
                selected={goals}
                onChange={setGoals}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingGoals(false)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button
                  onClick={saveGoals}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          ) : (
            <TagList
              items={profile?.goals ?? []}
              emptyText="No goals set — tap Edit to choose yours"
            />
          )}
        </Section>

        {/* Relapses */}
        <Section icon={Zap} title="Relapses">
          <p className="text-xs text-muted-foreground">Track and review your MS flare-ups over time.</p>
          <Link
            to="/relapses"
            className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>View Relapses</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Section>

        {/* Neurologist quick view */}
        {(profile?.neurologist_name || profile?.neurologist_email) && (
          <Section icon={Stethoscope} title="My Neurologist">
            <div className="text-sm space-y-1">
              {profile.neurologist_name && (
                <p className="font-medium text-foreground">{profile.neurologist_name}</p>
              )}
              {profile.neurologist_email && (
                <p className="text-xs text-muted-foreground">{profile.neurologist_email}</p>
              )}
            </div>
            <Link
              to="/profile"
              className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
            >
              <span>Edit in Profile</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Section>
        )}
      </div>
    </>
  );
};

export default MyMSHistoryPage;
