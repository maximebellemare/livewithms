import { useState } from "react";
import { Ban, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBlockedUsers, useUnblockUser } from "@/hooks/useUserBlocks";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BlockedUsersCard = () => {
  const { data: blockedUsers = [], isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const [unblockTarget, setUnblockTarget] = useState<{
    id: string;
    display_name: string;
  } | null>(null);

  const handleUnblock = async () => {
    if (!unblockTarget) return;
    try {
      await unblockUser.mutateAsync(unblockTarget.id);
      toast.success(`${unblockTarget.display_name} has been unblocked`);
      setUnblockTarget(null);
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  if (isLoading) return null;
  if (blockedUsers.length === 0) return null;

  return (
    <>
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Blocked Users ({blockedUsers.length})
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Blocked users can't see you in matching or message you.
        </p>
        <div className="space-y-2">
          {blockedUsers.map((blocked) => (
            <div
              key={blocked.id}
              className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={blocked.avatar_url ?? undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {(blocked.display_name || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="flex-1 text-sm font-medium text-foreground truncate">
                {blocked.display_name || "Unknown User"}
              </p>
              <button
                onClick={() =>
                  setUnblockTarget({
                    id: blocked.id,
                    display_name: blocked.display_name || "Unknown User",
                  })
                }
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                <UserX className="h-3.5 w-3.5" />
                Unblock
              </button>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog
        open={!!unblockTarget}
        onOpenChange={(open) => {
          if (!open) setUnblockTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unblock {unblockTarget?.display_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They'll be able to see you in matching again and send you messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock}>
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlockedUsersCard;
