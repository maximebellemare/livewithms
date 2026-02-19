import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Shield } from "lucide-react";
import PageHeader from "@/components/PageHeader";
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

const CommunityPage = () => {
  const { data: channels = [], isLoading } = useChannels();
  const { data: roles = [] } = useUserRoles();
  const { data: communityRoles = {} } = useCommunityRoles();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    markCommunityVisited();
  }, []);

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
      <PageHeader title="Community" subtitle="You're not alone" action={savedAction} />
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
            communityRoles={communityRoles}
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
          <>
            <TrendingPosts
              channels={channels}
              onSelectPost={setSelectedPost}
              onSelectChannel={setSelectedChannel}
            />
            <WeeklyHighlights
              channels={channels}
              onSelectPost={setSelectedPost}
              onSelectChannel={setSelectedChannel}
            />
            <ChannelList
              channels={channels}
              onSelect={setSelectedChannel}
              roles={roles}
            />
            <Link
              to="/community/guidelines"
              className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground transition-colors hover:bg-muted"
            >
              <Shield className="h-4 w-4 text-primary" />
              <span>Community Guidelines</span>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default CommunityPage;
