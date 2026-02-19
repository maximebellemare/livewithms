import { useState } from "react";
import { Plus, ArrowLeft, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Channel, Post, usePosts, useCreatePost, useHidePost, useDisplayName,
} from "@/hooks/useCommunity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PostCard } from "./PostCard";

export const PostFeed = ({
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
            <Button onClick={() => setShowCreate(true)} className="w-full mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          ) : (
            <div className="rounded-xl bg-card p-4 shadow-soft mb-4 space-y-3">
              <Input placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
              <Textarea placeholder="What's on your mind?" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={5000} />
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
