import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  useChannels, useUserRoles, Channel, Post,
} from "@/hooks/useCommunity";
import { ChannelList } from "@/components/community/ChannelList";
import { PostFeed } from "@/components/community/PostFeed";
import { PostDetail } from "@/components/community/PostDetail";

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
