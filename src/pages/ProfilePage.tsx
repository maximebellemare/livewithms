import PageHeader from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { ChevronRight, Download, Shield, Trash2, ExternalLink, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Your MS companion settings" />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">
        {/* User info */}
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl">
              🧡
            </div>
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {profile?.ms_type ? `${profile.ms_type} Profile` : "My MS Profile"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="mt-3 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-muted"
          >
            <span>Edit MS Profile</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Doctor Report */}
        <Link
          to="/reports"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent p-4 shadow-soft transition-all hover:shadow-card active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Doctor-Ready Report</p>
            <p className="text-xs text-muted-foreground">Generate PDF for your neurologist</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {/* Settings */}
        <div className="space-y-1">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Settings</p>
          {[
            { icon: Shield, label: "Privacy & Consent", desc: "Manage your data preferences" },
            { icon: Download, label: "Export Data", desc: "Download your health data" },
          ].map(({ icon: Icon, label, desc }) => (
            <button key={label} className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="tap-highlight-none flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary text-foreground"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
          </button>
        </div>

        {/* Crisis resources */}
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs font-medium text-foreground">Need support?</p>
          <a href="https://www.nationalmssociety.org" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            National MS Society <ExternalLink className="h-3 w-3" />
          </a>
          <p className="mt-2 text-[10px] text-muted-foreground">Crisis Line: 988 (Suicide & Crisis Lifeline)</p>
        </div>

        <p className="pb-4 text-center text-[10px] text-muted-foreground">
          LiveWithMS v1.0 · Not medical advice · © 2026
        </p>
      </div>
    </>
  );
};

export default ProfilePage;
