import { useState } from "react";
import { Heart, MessageCircle, Pin, ArrowLeft, Send, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Post, useComments, useCreateComment, usePostLikes, useToggleLike,
  useHideComment, useDisplayName, useEditComment, useDeleteComment,
} from "@/hooks/useCommunity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });

export const PostDetail = ({
  post, onBack, roles,
}: { post: Post; onBack: () => void; roles: string[] }) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(post.id);
  const { data: displayName = "Anonymous" } = useDisplayName();
  const { data: isLiked = false } = usePostLikes(post.id);
  const toggleLike = useToggleLike();
  const createComment = useCreateComment();
  const hideComment = useHideComment();
  const editComment = useEditComment();
  const deleteComment = useDeleteComment();
  const [body, setBody] = useState("");

  const isMod = roles.includes("admin") || roles.includes("moderator");

  // Per-comment edit/delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentBody, setEditCommentBody] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const handleComment = async () => {
    if (!body.trim() || !user) return;
    if (body.trim().length > 2000) { toast.error("Comment must be under 2000 characters"); return; }
    try {
      await createComment.mutateAsync({
        post_id: post.id,
        user_id: user.id,
        display_name: displayName,
        body: body.trim(),
      });
      setBody("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-3 text-sm font-medium text-primary flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to posts
      </button>

      {/* Post */}
      <div className="rounded-xl bg-card p-4 shadow-soft mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
            <p className="text-xs font-medium text-primary">{post.display_name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">{post.title}</h2>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.body}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <button
            onClick={() => toggleLike.mutate({ postId: post.id, isLiked })}
            className={`tap-highlight-none flex items-center gap-1 ${isLiked ? "text-primary" : "hover:text-primary"}`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-primary" : ""}`} /> {post.likes_count}
          </button>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {comments.length}
          </span>
        </div>
      </div>

      {/* Comments */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Comments
      </p>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-4">No comments yet. Share your thoughts!</p>
      ) : (
        <div className="space-y-2 mb-4">
          {comments.map((c) => {
            const isCommentOwner = user?.id === c.user_id;
            const isEditing = editingCommentId === c.id;

            return (
              <div key={c.id} className={`rounded-lg bg-accent/50 p-3 ${c.is_hidden ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium text-primary">{c.display_name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</p>
                    {isCommentOwner && !isEditing && (
                      <>
                        <button
                          onClick={() => { setEditingCommentId(c.id); setEditCommentBody(c.body); }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setDeletingCommentId(c.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    {isMod && (
                      <button
                        onClick={() => hideComment.mutate({ commentId: c.id, hidden: !c.is_hidden })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {c.is_hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editCommentBody}
                      onChange={(e) => setEditCommentBody(e.target.value)}
                      rows={2}
                      maxLength={2000}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!editCommentBody.trim() || editComment.isPending}
                        onClick={async () => {
                          await editComment.mutateAsync({ commentId: c.id, body: editCommentBody.trim() });
                          setEditingCommentId(null);
                          toast.success("Comment updated");
                        }}
                      >
                        {editComment.isPending ? "Saving…" : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-foreground whitespace-pre-wrap">{c.body}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete comment confirmation */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={(open) => !open && setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingCommentId) {
                  await deleteComment.mutateAsync(deletingCommentId);
                  setDeletingCommentId(null);
                  toast.success("Comment deleted");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add comment */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={2000}
          className="flex-1"
        />
        <Button
          size="icon"
          disabled={!body.trim() || createComment.isPending}
          onClick={handleComment}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">Commenting as: <strong>{displayName}</strong></p>
    </div>
  );
};
