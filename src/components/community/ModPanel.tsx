import { useState } from "react";
import { Shield, EyeOff } from "lucide-react";
import { usePendingReports, useResolveReport, useHidePost, useHideComment } from "@/hooks/useCommunity";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });

export const ModPanel = () => {
  const { data: reports = [] } = usePendingReports();
  const resolveReport = useResolveReport();
  const hidePost = useHidePost();
  const hideComment = useHideComment();
  const [open, setOpen] = useState(false);

  if (reports.length === 0) return (
    <div className="rounded-xl bg-accent/50 p-3 flex items-center gap-2">
      <Shield className="h-4 w-4 text-primary" />
      <span className="text-xs text-muted-foreground">No pending reports</span>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-destructive/10 p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-destructive">{reports.length} pending report{reports.length !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-xs text-destructive">Review →</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Reports</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {reports.map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                <p className="text-sm text-foreground">{r.reason}</p>
                <p className="text-[10px] text-muted-foreground">
                  {r.post_id ? `Post: ${r.post_id.slice(0, 8)}…` : `Comment: ${r.comment_id?.slice(0, 8)}…`}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (r.post_id) await hidePost.mutateAsync({ postId: r.post_id, hidden: true });
                      if (r.comment_id) await hideComment.mutateAsync({ commentId: r.comment_id, hidden: true });
                      await resolveReport.mutateAsync({ reportId: r.id, status: "resolved" });
                      toast.success("Content hidden & report resolved");
                    }}
                  >
                    <EyeOff className="h-3 w-3 mr-1" /> Hide content
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await resolveReport.mutateAsync({ reportId: r.id, status: "dismissed" });
                      toast.success("Report dismissed");
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
