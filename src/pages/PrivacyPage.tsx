import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Shield, Download, Trash2, AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEntriesInRange } from "@/hooks/useEntries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subYears } from "date-fns";

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Fetch all entries for export (last 5 years)
  const start = format(subYears(new Date(), 5), "yyyy-MM-dd");
  const end = format(new Date(), "yyyy-MM-dd");
  const { data: entries } = useEntriesInRange(start, end);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      // Gather all user data
      const [entriesRes, medsRes, apptRes, profileRes, medLogsRes] = await Promise.all([
        supabase.from("daily_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("medications").select("*").eq("user_id", user.id),
        supabase.from("appointments").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("medication_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data?.[0] ?? null,
        daily_entries: entriesRes.data ?? [],
        medications: medsRes.data ?? [],
        medication_logs: medLogsRes.data ?? [],
        appointments: apptRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `livewithms-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (err: any) {
      toast.error("Failed to export data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE" || !user) return;
    setDeleting(true);
    try {
      // Delete all user data from all tables
      await Promise.all([
        supabase.from("daily_entries").delete().eq("user_id", user.id),
        supabase.from("medication_logs").delete().eq("user_id", user.id),
        supabase.from("medications").delete().eq("user_id", user.id),
        supabase.from("appointments").delete().eq("user_id", user.id),
        supabase.from("push_subscriptions").delete().eq("user_id", user.id),
        supabase.from("report_history").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);

      await signOut();
      toast.success("Your data has been deleted. Account signed out.");
      navigate("/");
    } catch (err: any) {
      toast.error("Failed to delete data: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Privacy & Data" showBack />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">

        {/* Privacy info */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-display text-base font-semibold text-foreground">Your Data, Your Control</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>• Your health data is encrypted and stored securely</p>
            <p>• We never share your data with third parties</p>
            <p>• Only you can access your symptom logs and medical information</p>
            <p>• This app does not provide medical advice — always consult your neurologist</p>
          </div>
        </div>

        {/* Export data */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="font-display text-base font-semibold text-foreground">Export Your Data</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Download all your health data as a JSON file. Includes symptom logs, medications, appointments, and profile information.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download My Data
              </>
            )}
          </button>
        </div>

        {/* Delete account */}
        <div className="rounded-xl border border-destructive/20 bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-base font-semibold text-foreground">Delete Account & Data</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Permanently delete all your health data including symptom logs, medications, appointments, and profile information. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              Delete My Data
            </button>
          ) : (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">This is permanent</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All your symptom logs, medications, appointments, and profile data will be permanently deleted. You will be signed out.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 rounded-lg bg-secondary py-2 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive py-2 text-sm font-semibold text-destructive-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                >
                  {deleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deleting ? "Deleting…" : "Delete Everything"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-[10px] text-muted-foreground pb-8">
          ⚕️ This app does not provide medical advice. Always consult your healthcare provider.
        </p>
      </div>
    </>
  );
};

export default PrivacyPage;
