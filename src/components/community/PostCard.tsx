import { useState } from "react";
import { MessageCircle, Flag, Pin, EyeOff, Eye, Pencil, Trash2, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CommunityAvatar } from "./CommunityAvatar";
import { RoleBadge } from "./RoleBadge";
import { ReactionBar } from "./ReactionBar";
import {
  Post, useCreateReport,
  useEditPost, useDeletePost, useIsBookmarked, useToggleBookmark,
} from "@/hooks/useCommunity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });

export const PostCard = ({
  post, onClick, isMod, onHide, userRoles,
}: { post: Post; onClick: () => void; isMod: boolean; onHide: any; userRoles?: string[] }) => {
  const { user } = useAuth();
  const createReport = useCreateReport();
  const editPost = useEditPost();
  const deletePost = useDeletePost();
  const { data: isBookmarked = false } = useIsBookmarked(post.id);
  const toggleBookmark = useToggleBookmark();
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [showDelete, setShowDelete] = useState(false);

  const isOwner = user?.id === post.user_id;

  return (
    <div className={`rounded-xl bg-card p-4 shadow-soft ${post.is_hidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          <CommunityAvatar userId={post.user_id} displayName={post.display_name} />
          <p className="text-xs font-medium text-primary">{post.display_name}</p>
          {userRoles && <RoleBadge roles={userRoles} />}
        </div>
        <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
      </div>
      <button onClick={onClick} className="text-left w-full mt-1.5">
        <p className="text-sm font-semibold text-foreground">{post.title}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{post.body}</p>
      </button>
      <div className="mt-3 space-y-2">
        <ReactionBar postId={post.id} />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <button onClick={onClick} className="tap-highlight-none flex items-center gap-1 hover:text-primary">
            <MessageCircle className="h-3.5 w-3.5" /> {post.comments_count}
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => { setEditTitle(post.title); setEditBody(post.body); setShowEdit(true); }}
                className="tap-highlight-none flex items-center gap-1 hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="tap-highlight-none flex items-center gap-1 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => toggleBookmark.mutate({ postId: post.id, isBookmarked })}
            className={`tap-highlight-none ml-auto flex items-center gap-1 hover:text-primary ${isBookmarked ? "text-primary" : ""}`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-primary" : ""}`} />
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="tap-highlight-none flex items-center gap-1 hover:text-destructive"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
          {isMod && (
            <button
              onClick={() => onHide.mutate({ postId: post.id, hidden: !post.is_hidden })}
              className="tap-highlight-none flex items-center gap-1 hover:text-destructive"
            >
              {post.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Post</DialogTitle></DialogHeader>
          <div>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} />
            <p className={`text-[10px] mt-1 text-right ${editTitle.length > 180 ? "text-destructive" : "text-muted-foreground"}`}>{editTitle.length}/200</p>
          </div>
          <div>
            <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} maxLength={5000} />
            <p className={`text-[10px] mt-1 text-right ${editBody.length > 4500 ? "text-destructive" : "text-muted-foreground"}`}>{editBody.length}/5000</p>
          </div>
          <DialogFooter>
            <Button
              disabled={!editTitle.trim() || !editBody.trim() || editPost.isPending}
              onClick={async () => {
                await editPost.mutateAsync({ postId: post.id, title: editTitle.trim(), body: editBody.trim() });
                setShowEdit(false);
                toast.success("Post updated");
              }}
            >
              {editPost.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Your post and all its comments will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await deletePost.mutateAsync(post.id);
                toast.success("Post deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Post</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Why are you reporting this?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={async () => {
                if (!user) return;
                await createReport.mutateAsync({ reporter_id: user.id, post_id: post.id, reason: reason.trim() });
                setReason("");
                setShowReport(false);
                toast.success("Report submitted. Thank you.");
              }}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
