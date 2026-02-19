import { Shield, ShieldCheck } from "lucide-react";

interface RoleBadgeProps {
  roles: string[];
}

export const RoleBadge = ({ roles }: RoleBadgeProps) => {
  if (roles.includes("admin")) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
        <ShieldCheck className="h-2.5 w-2.5" /> Admin
      </span>
    );
  }
  if (roles.includes("moderator")) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Shield className="h-2.5 w-2.5" /> Mod
      </span>
    );
  }
  return null;
};
