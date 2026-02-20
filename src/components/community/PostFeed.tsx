import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowLeft, AlertTriangle, Search, ArrowUpDown, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Channel, Post, usePosts, useCreatePost, useHidePost, useDisplayName,
} from "@/hooks/useCommunity";
import { useCommunityRoles } from "@/hooks/useCommunityRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PostCard } from "./PostCard";
import AnimatedList, { listItemVariants } from "@/components/AnimatedList";
import { motion } from "framer-motion";

export const PostFeed = ({
  channel, onBack, onSelectPost, roles,
}: { channel: Channel; onBack: () => void; onSelectPost: (p: Post) => void; roles: string[] }) => {
  const { user } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = usePosts(channel.id);
  const posts = useMemo(() => data?.pages.flatMap((p) => p) ?? [], [data]);
  const { data: displayName = "Anonymous" } = useDisplayName();
  const createPost = useCreatePost();
  const hidePost = useHidePost();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "reactions" | "comments">("newest");

  const { data: communityRoles = {} } = useCommunityRoles();
  const isMod = roles.includes("admin") || roles.includes("moderator");

  /* ─── Infinite scroll sentinel ─────────────────────────── */
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

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

  const isCrisis = channel.is_locked;

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.display_name.toLowerCase().includes(q)
      );
    }
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "reactions") {
      result = [...result].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
    } else if (sortBy === "comments") {
      result = [...result].sort((a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0));
    }
    return result;
  }, [posts, search, sortBy]);

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
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 mb-3">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {(["newest", "reactions", "comments"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  sortBy === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "newest" ? "Newest" : option === "reactions" ? "Most reactions" : "Most comments"}
              </button>
            ))}
          </div>

          {!showCreate ? (
            <Button onClick={() => setShowCreate(true)} className="w-full mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          ) : (
            <div className="rounded-xl bg-card p-4 shadow-soft mb-4 space-y-3">
              <div>
                <Input placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
                <p className={`text-[10px] mt-1 text-right ${title.length > 180 ? "text-destructive" : "text-muted-foreground"}`}>{title.length}/200</p>
              </div>
              <div>
                <Textarea placeholder="What's on your mind?" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={5000} />
                <p className={`text-[10px] mt-1 text-right ${body.length > 4500 ? "text-destructive" : "text-muted-foreground"}`}>{body.length}/5000</p>
              </div>
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
        <div className="space-y-3 animate-fade-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-card p-4 shadow-soft space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-3 pt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border shadow-soft px-6 py-10 text-center space-y-3 animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/50">
            <svg viewBox="0 0 48 48" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 36V12a4 4 0 014-4h28a4 4 0 014 4v16a4 4 0 01-4 4H14l-8 8z" />
              <circle cx="18" cy="20" r="2" fill="currentColor" opacity="0.4" />
              <circle cx="24" cy="20" r="2" fill="currentColor" opacity="0.4" />
              <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {isCrisis ? "Resources above" : search.trim() ? "No matching posts" : "Start the conversation"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {isCrisis
              ? "Crisis resources are pinned at the top of this channel."
              : search.trim()
                ? "Try a different search term or browse all posts."
                : "Be the first to share — your experience could help someone else."}
          </p>
        </div>
      ) : (
        <AnimatedList className="space-y-3">
          {filteredPosts.map((post) => (
            <motion.div key={post.id} variants={listItemVariants}>
              <PostCard post={post} onClick={() => onSelectPost(post)} isMod={isMod} onHide={hidePost} userRoles={communityRoles[post.user_id]} />
            </motion.div>
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </AnimatedList>
      )}
    </div>
  );
};
