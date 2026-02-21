import { useState } from "react";
import { EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAdminReports } from "@/hooks/useAdmin";
import { useResolveReport, useHidePost, useHideComment } from "@/hooks/useCommunity";

const ModerationTab = () => {
  const { data: reports = [], isLoading } = useAdminReports();
  const resolveReport = useResolveReport();
  const hidePost = useHidePost();
  const hideComment = useHideComment();
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const pending = reports.filter((r: any) => r.status === "pending");
  const display = tab === "pending" ? pending : reports;

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;

  return (
    <>
      <div className="flex gap-2 mb-3">
        <Button
          variant={tab === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("pending")}
        >
          Pending ({pending.length})
        </Button>
        <Button
          variant={tab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("all")}
        >
          All ({reports.length})
        </Button>
      </div>

      {display.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {tab} reports</p>
        </div>
      ) : (
        <div className="space-y-2">
          {display.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {r.post_id ? `Post ${r.post_id.slice(0, 8)}…` : `Comment ${r.comment_id?.slice(0, 8)}…`}
                      {" · "}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant={r.status === "pending" ? "destructive" : r.status === "resolved" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {r.status}
                  </Badge>
                </div>
                {r.status === "pending" && (
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
                      <EyeOff className="h-3 w-3 mr-1" /> Hide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await resolveReport.mutateAsync({ reportId: r.id, status: "dismissed" });
                        toast.success("Report dismissed");
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default ModerationTab;
