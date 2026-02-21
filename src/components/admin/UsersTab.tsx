import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAdminUsers, useToggleRole } from "@/hooks/useAdmin";

const UsersTab = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleRole = useToggleRole();
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u: any) =>
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.includes(search)
  );

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>;

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Input
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} users</span>
      </div>
      <div className="space-y-2">
        {filtered.map((u: any) => {
          const isMod = u.roles.includes("moderator");
          const isAdmin = u.roles.includes("admin");
          return (
            <Card key={u.user_id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(u.display_name ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.display_name || "Anonymous"}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>{u.ms_type || "—"}</span>
                    <span>·</span>
                    <span>Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.roles.map((r: string) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px]">
                      {r}
                    </Badge>
                  ))}
                  {!isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={isMod ? "Remove moderator" : "Make moderator"}
                      disabled={toggleRole.isPending}
                      onClick={async () => {
                        await toggleRole.mutateAsync({
                          userId: u.user_id,
                          role: "moderator",
                          action: isMod ? "remove" : "add",
                        });
                        toast.success(isMod ? "Moderator role removed" : "Moderator role assigned");
                      }}
                    >
                      {isMod ? <ShieldOff className="h-3.5 w-3.5 text-destructive" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default UsersTab;
