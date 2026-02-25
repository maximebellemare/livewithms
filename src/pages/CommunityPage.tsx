import { useState, useEffect, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import PullToRefresh from "@/components/PullToRefresh";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import { Link } from "react-router-dom";
import { Bookmark, Shield } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChannels, useUserRoles, Channel, Post,
} from "@/hooks/useCommunity";
import { useCommunityRoles } from "@/hooks/useCommunityRoles";
import { markCommunityVisited } from "@/hooks/useUnreadCommunity";
import { ChannelList } from "@/components/community/ChannelList";
import { PostFeed } from "@/components/community/PostFeed";
import { PostDetail } from "@/components/community/PostDetail";
import { TrendingPosts } from "@/components/community/TrendingPosts";
import { WeeklyHighlights } from "@/components/community/WeeklyHighlights";
import { SavedPosts } from "@/components/community/SavedPosts";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CommunityPage = () => {
  const queryClient = useQueryClient();
  const { data: channels = [], isLoading } = useChannels();
  const { data: roles = [] } = useUserRoles();
  const { data: communityRoles = {} } = useCommunityRoles();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  // Fetch premium users for badge display
  const { data: premiumUsers = new Set<string>() } = useQuery({
    queryKey: ["premium-users-community"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles_public")
        .select("user_id, is_premium")
        .eq("is_premium", true);
      return new Set(((data as any[]) ?? []).map((p: any) => p.user_id as string));
    },
  });

  useEffect(() => {
    markCommunityVisited();
  }, []);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["community"] });
  }, [queryClient]);

  const savedAction = (
    <Button
      variant={showSaved ? "default" : "ghost"}
      size="sm"
      className="gap-1.5"
      onClick={() => { setShowSaved(!showSaved); setSelectedChannel(null); setSelectedPost(null); }}
    >
      <Bookmark className={`h-4 w-4 ${showSaved ? "fill-primary-foreground" : ""}`} />
      <span className="text-xs">Saved</span>
    </Button>
  );

  return (
    <>
      <SEOHead title="Community" description="Connect with others living with MS — share, support, and learn together." />
      <PageHeader title="Community" subtitle="You're not alone" action={savedAction} />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="space-y-4 animate-fade-in">
            <Skeleton className="h-5 w-40 mb-2" />
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-44 flex-shrink-0 rounded-xl" />)}
            </div>
            <Skeleton className="h-5 w-32 mt-2" />
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : selectedPost ? (
          <PostDetail
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            roles={roles}
            communityRoles={communityRoles}
            premiumUsers={premiumUsers}
          />
        ) : showSaved ? (
          <SavedPosts
            channels={channels}
            onSelectPost={setSelectedPost}
            onSelectChannel={setSelectedChannel}
          />
        ) : selectedChannel ? (
          <PostFeed
            channel={selectedChannel}
            onBack={() => setSelectedChannel(null)}
            onSelectPost={setSelectedPost}
            roles={roles}
          />
        ) : (
          <StaggerContainer className="space-y-0">
            <StaggerItem>
            <div data-tour="community-trending">
              <TrendingPosts
                channels={channels}
                onSelectPost={setSelectedPost}
                onSelectChannel={setSelectedChannel}
              />
            </div>
            </StaggerItem>
            <StaggerItem>
            <WeeklyHighlights
              channels={channels}
              onSelectPost={setSelectedPost}
              onSelectChannel={setSelectedChannel}
            />
            </StaggerItem>
            <StaggerItem>
            <div data-tour="community-channels">
              <ChannelList
                channels={channels}
                onSelect={setSelectedChannel}
                roles={roles}
              />
            </div>
            </StaggerItem>
            <StaggerItem>
            <Link
              to="/community/guidelines"
              className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground transition-colors hover:bg-muted"
            >
              <Shield className="h-4 w-4 text-primary" />
              <span>Community Guidelines</span>
            </Link>
            </StaggerItem>
          </StaggerContainer>
        )}
      </PullToRefresh>
    </>
  );
};

export default CommunityPage;
