import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import { useConversations } from "@/hooks/useMessages";

const MessagesPage = () => {
  const { data: conversations = [], isLoading } = useConversations();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("conversation"));

  // Update selected when URL param changes
  useEffect(() => {
    const fromUrl = searchParams.get("conversation");
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  const selectedConvo = conversations.find((c) => c.id === selectedId) || null;

  return (
    <>
      <SEOHead title="Messages" description="Your direct messages with community members." />
      {!selectedConvo && <PageHeader title="Messages" subtitle="Your conversations" showBack />}
      <div className="mx-auto max-w-lg" style={{ height: selectedConvo ? "calc(100vh - 80px)" : "auto" }}>
        {selectedConvo ? (
          <MessageThread
            conversation={selectedConvo}
            onBack={() => setSelectedId(null)}
          />
        ) : isLoading ? (
          <div className="space-y-3 px-4 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-secondary animate-pulse" />
                  <div className="h-3 w-40 rounded bg-secondary animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>
    </>
  );
};

export default MessagesPage;
