import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Heart, MessageCircle, Flag, Plus, Send, ArrowLeft, Pin, EyeOff, Eye, Shield, ChevronDown, Lock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useChannels, usePosts, useCreatePost, useComments, useCreateComment,
  usePostLikes, useToggleLike, useCreateReport, useUserRoles,
  useHidePost, useHideComment, useDisplayName, Channel, Post,
  usePendingReports, useResolveReport,
} from "@/hooks/useCommunity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

/* ─── Helpers ─────────────────────────────────────────────── */
const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });

/* ─── Channel List ────────────────────────────────────────── */
const ChannelList = ({
  channels, onSelect, roles,
}: { channels: Channel[]; onSelect: (ch: Channel) => void; roles: string[] }) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Channel[]>();
    channels.forEach((ch) => {
      const arr = map.get(ch.category) || [];
      arr.push(ch);
      map.set(ch.category, arr);
    });
    return map;
  }, [channels]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (cat: string) => setCollapsed((s) => {
    const next = new Set(s);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    return next;
  });

  const isMod = roles.includes("admin") || roles.includes("moderator");

  return (
    <div className="space-y-4 animate-fade-in">
      {isMod && <ModPanel />}
      {Array.from(grouped.entries()).map(([category, chs]) => (
        <div key={category}>
          <button
            onClick={() => toggle(category)}
            className="flex w-full items-center justify-between mb-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </p>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${collapsed.has(category) ? "" : "rotate-180"}`} />
          </button>
          {!collapsed.has(category) && (
            <div className="space-y-2">
              {chs.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onSelect(ch)}
                  className="tap-highlight-none flex w-full items-center gap-3 rounded-xl bg-card p-3 shadow-soft transition-all active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-base">
                    {ch.emoji}
                  </span>
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{ch.name}</p>
                      {ch.is_locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    {ch.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{ch.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="mt-4 rounded-xl bg-accent p-4 text-center">
        <p className="text-xs text-accent-foreground">
          💛 This is a safe, moderated space. Be kind, be supportive.
        </p>
      </div>
    </div>
  );
};

/* ─── Moderation Panel ────────────────────────────────────── */
const ModPanel = () => {
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

/* ─── Post Feed ───────────────────────────────────────────── */
const PostFeed = ({
  channel, onBack, onSelectPost, roles,
}: { channel: Channel; onBack: () => void; onSelectPost: (p: Post) => void; roles: string[] }) => {
  const { user } = useAuth();
  const { data: posts = [], isLoading } = usePosts(channel.id);
  const { data: displayName = "Anonymous" } = useDisplayName();
  const createPost = useCreatePost();
  const hidePost = useHidePost();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const isMod = roles.includes("admin") || roles.includes("moderator");

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !user) return;
    if (title.trim().length > 200) { toast.error("Title must be under 200 characters"); return; }
    if (body.trim().length > 5000) { toast.error("Post must be under 5000 characters"); return; }
    try {
      await createPost.mutateAsync({
        channel_id: channel.id,
        user_id: user.id,
        display_name: displayName,
        title: title.trim(),
        body: body.trim(),
      });
      setTitle("");
      setBody("");
      setShowCreate(false);
      toast.success("Post created!");
    } catch {
      toast.error("Failed to create post");
    }
  };

  // Crisis channel banner
  const isCrisis = channel.is_locked;

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-3 text-sm font-medium text-primary flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to channels
      </button>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{channel.emoji}</span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{channel.name}</h2>
          {channel.description && <p className="text-[11px] text-muted-foreground">{channel.description}</p>}
        </div>
      </div>

      {isCrisis && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Crisis Resources</span>
          </div>
          <p className="text-xs text-foreground">If you or someone you know is in crisis, please reach out:</p>
          <ul className="text-xs text-foreground space-y-1">
            <li>🇺🇸 <strong>988 Suicide & Crisis Lifeline</strong>: Call or text <strong>988</strong></li>
            <li>🇺🇸 <strong>Crisis Text Line</strong>: Text HOME to <strong>741741</strong></li>
            <li>🌍 <strong>International Association for Suicide Prevention</strong>: <a href="https://www.iasp.info/resources/Crisis_Centres/" className="text-primary underline" target="_blank" rel="noopener">Find local resources</a></li>
            <li>🧡 <strong>MS Society</strong>: <a href="https://www.nationalmssociety.org" className="text-primary underline" target="_blank" rel="noopener">nationalmssociety.org</a></li>
          </ul>
          <p className="text-[10px] text-muted-foreground mt-2">This channel is for resources only. Posts are not allowed.</p>
        </div>
      )}

      {!isCrisis && (
        <>
          {!showCreate ? (
            <Button
              onClick={() => setShowCreate(true)}
              className="w-full mb-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          ) : (
            <div className="rounded-xl bg-card p-4 shadow-soft mb-4 space-y-3">
              <Input
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <Textarea
                placeholder="What's on your mind?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={5000}
              />
              <p className="text-[10px] text-muted-foreground">Posting as: <strong>{displayName}</strong></p>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={createPost.isPending || !title.trim() || !body.trim()} size="sm">
                  {createPost.isPending ? "Posting…" : "Post"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setTitle(""); setBody(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isLoading ? (
        <div className="py-12 text-center"><p className="text-sm text-muted-foreground">Loading posts…</p></div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">{isCrisis ? "Resources are pinned above." : "No posts yet. Be the first!"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onClick={() => onSelectPost(post)} isMod={isMod} onHide={hidePost} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Post Card ───────────────────────────────────────────── */
const PostCard = ({
  post, onClick, isMod, onHide,
}: { post: Post; onClick: () => void; isMod: boolean; onHide: any }) => {
  const { user } = useAuth();
  const { data: isLiked = false } = usePostLikes(post.id);
  const toggleLike = useToggleLike();
  const createReport = useCreateReport();
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className={`rounded-xl bg-card p-4 shadow-soft ${post.is_hidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          <p className="text-xs font-medium text-primary">{post.display_name}</p>
        </div>
        <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
      </div>
      <button onClick={onClick} className="text-left w-full mt-1.5">
        <p className="text-sm font-semibold text-foreground">{post.title}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{post.body}</p>
      </button>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <button
          onClick={() => toggleLike.mutate({ postId: post.id, isLiked })}
          className={`tap-highlight-none flex items-center gap-1 ${isLiked ? "text-primary" : "hover:text-primary"}`}
        >
          <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-primary" : ""}`} /> {post.likes_count}
        </button>
        <button onClick={onClick} className="tap-highlight-none flex items-center gap-1 hover:text-primary">
          <MessageCircle className="h-3.5 w-3.5" /> {post.comments_count}
        </button>
        <button
          onClick={() => setShowReport(true)}
          className="tap-highlight-none ml-auto flex items-center gap-1 hover:text-destructive"
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

/* ─── Post Detail ─────────────────────────────────────────── */
const PostDetail = ({
  post, onBack, roles,
}: { post: Post; onBack: () => void; roles: string[] }) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(post.id);
  const { data: displayName = "Anonymous" } = useDisplayName();
  const { data: isLiked = false } = usePostLikes(post.id);
  const toggleLike = useToggleLike();
  const createComment = useCreateComment();
  const hideComment = useHideComment();
  const [body, setBody] = useState("");

  const isMod = roles.includes("admin") || roles.includes("moderator");

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
          {comments.map((c) => (
            <div key={c.id} className={`rounded-lg bg-accent/50 p-3 ${c.is_hidden ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-medium text-primary">{c.display_name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</p>
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
              <p className="text-xs text-foreground whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

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

/* ─── Main Page ───────────────────────────────────────────── */
const CommunityPage = () => {
  const { data: channels = [], isLoading } = useChannels();
  const { data: roles = [] } = useUserRoles();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <>
      <PageHeader title="Community" subtitle="You're not alone" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Loading community…</p>
          </div>
        ) : selectedPost ? (
          <PostDetail
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            roles={roles}
          />
        ) : selectedChannel ? (
          <PostFeed
            channel={selectedChannel}
            onBack={() => setSelectedChannel(null)}
            onSelectPost={setSelectedPost}
            roles={roles}
          />
        ) : (
          <ChannelList
            channels={channels}
            onSelect={setSelectedChannel}
            roles={roles}
          />
        )}
      </div>
    </>
  );
};

export default CommunityPage;
