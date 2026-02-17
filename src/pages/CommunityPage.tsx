import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Heart, MessageCircle, Flag } from "lucide-react";

const channels = [
  { id: "fatigue", name: "Fatigue", emoji: "🔋", members: 234 },
  { id: "brain-fog", name: "Brain Fog", emoji: "🌫️", members: 189 },
  { id: "medications", name: "Medications", emoji: "💊", members: 312 },
  { id: "newly-diagnosed", name: "Newly Diagnosed", emoji: "🌱", members: 156 },
  { id: "exercise", name: "Exercise & Movement", emoji: "🏃", members: 98 },
  { id: "mental-health", name: "Mental Health", emoji: "🧠", members: 267 },
];

const samplePosts = [
  {
    id: "1",
    channel: "fatigue",
    author: "MSWarrior_22",
    content: "Does anyone else find that their fatigue gets worse in the afternoon? I've been trying to pace myself but it's hard. Any tips appreciated 🧡",
    likes: 24,
    comments: 8,
    time: "2h ago",
  },
  {
    id: "2",
    channel: "medications",
    author: "Anonymous",
    content: "Just started Ocrevus last month. So far so good — less anxiety about it than I expected. Sending strength to everyone starting a new DMT.",
    likes: 41,
    comments: 12,
    time: "5h ago",
  },
  {
    id: "3",
    channel: "brain-fog",
    author: "FoggyButFine",
    content: "I started using a whiteboard in my kitchen for daily tasks and it has genuinely changed my life. Simple but so effective!",
    likes: 56,
    comments: 15,
    time: "1d ago",
  },
];

const CommunityPage = () => {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Community" subtitle="You're not alone" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {!activeChannel ? (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Topic Channels
            </p>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className="tap-highlight-none flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-soft transition-all active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg">
                  {ch.emoji}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{ch.name}</p>
                  <p className="text-xs text-muted-foreground">{ch.members} members</p>
                </div>
              </button>
            ))}
            <div className="mt-4 rounded-xl bg-accent p-4 text-center">
              <p className="text-xs text-accent-foreground">
                💛 This is a safe, moderated space. Be kind, be supportive.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <button
              onClick={() => setActiveChannel(null)}
              className="mb-3 text-sm font-medium text-primary"
            >
              ← Back to channels
            </button>
            <div className="space-y-3">
              {samplePosts
                .filter((p) => p.channel === activeChannel)
                .map((post) => (
                  <div key={post.id} className="rounded-xl bg-card p-4 shadow-soft">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-primary">{post.author}</p>
                      <p className="text-[10px] text-muted-foreground">{post.time}</p>
                    </div>
                    <p className="mt-2 text-sm text-foreground leading-relaxed">{post.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <button className="tap-highlight-none flex items-center gap-1 hover:text-primary">
                        <Heart className="h-3.5 w-3.5" /> {post.likes}
                      </button>
                      <button className="tap-highlight-none flex items-center gap-1 hover:text-primary">
                        <MessageCircle className="h-3.5 w-3.5" /> {post.comments}
                      </button>
                      <button className="tap-highlight-none ml-auto flex items-center gap-1 hover:text-destructive">
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              {samplePosts.filter((p) => p.channel === activeChannel).length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No posts in this channel yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CommunityPage;
