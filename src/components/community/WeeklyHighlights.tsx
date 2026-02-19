import { CalendarDays, MessageCircle, Heart } from "lucide-react";
import { Post, useWeeklyHighlights, Channel } from "@/hooks/useCommunity";
import { useCommunityRoles } from "@/hooks/useCommunityRoles";
import { RoleBadge } from "./RoleBadge";

interface WeeklyHighlightsProps {
  channels: Channel[];
  onSelectPost: (post: Post) => void;
  onSelectChannel: (channel: Channel) => void;
}

export const WeeklyHighlights = ({ channels, onSelectPost, onSelectChannel }: WeeklyHighlightsProps) => {
  const { data: posts = [], isLoading } = useWeeklyHighlights(5);
  const { data: communityRoles = {} } = useCommunityRoles();

  const highlights = posts.filter((p) => (p.likes_count ?? 0) + (p.comments_count ?? 0) > 0);

  if (isLoading || highlights.length === 0) return null;

  const channelMap = Object.fromEntries(channels.map((c) => [c.id, c]));

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">This Week's Highlights</h3>
      </div>
      <div className="space-y-2">
        {highlights.map((post) => {
          const ch = channelMap[post.channel_id];
          const daysAgo = Math.floor((Date.now() - new Date(post.created_at).getTime()) / 86400000);
          const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;
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
                  <div className="flex items-center gap-2 mb-0.5">
                     <p className="text-xs text-muted-foreground truncate">
                      {ch ? `${ch.emoji} ${ch.name}` : ""}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70">·</span>
                    <span className="text-[10px] text-muted-foreground/70">{timeLabel}</span>
                    {communityRoles[post.user_id] && <RoleBadge roles={communityRoles[post.user_id]} />}
                  </div>
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
    </div>
  );
};
