import { Bookmark, MessageCircle, Heart } from "lucide-react";
import { Post, useBookmarkedPosts, Channel } from "@/hooks/useCommunity";

interface SavedPostsProps {
  channels: Channel[];
  onSelectPost: (post: Post) => void;
  onSelectChannel: (channel: Channel) => void;
}

export const SavedPosts = ({ channels, onSelectPost, onSelectChannel }: SavedPostsProps) => {
  const { data: posts = [], isLoading } = useBookmarkedPosts();

  if (isLoading) return null;
  if (posts.length === 0) {
    return (
      <div className="py-8 text-center">
        <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No saved posts yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Tap the bookmark icon on any post to save it here</p>
      </div>
    );
  }

  const channelMap = Object.fromEntries(channels.map((c) => [c.id, c]));

  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const ch = channelMap[post.channel_id];
        return (
          <button
            key={post.id}
            onClick={() => {
              if (ch) onSelectChannel(ch);
              onSelectPost(post);
            }}
            className="w-full text-left rounded-xl bg-card p-3 shadow-soft hover:ring-1 hover:ring-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5 truncate">
                  {ch ? `${ch.emoji} ${ch.name}` : ""}
                </p>
                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.body}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                {(post.likes_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Heart className="h-3 w-3" /> {post.likes_count}
                  </span>
                )}
                {(post.comments_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <MessageCircle className="h-3 w-3" /> {post.comments_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
