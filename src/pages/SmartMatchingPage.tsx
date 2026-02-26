import { useState, useEffect, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { motion } from "framer-motion";
import { Users, MessageCircle, Heart, Shield, Sparkles, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyMatchProfile, useUpsertMatchProfile, useSmartMatches } from "@/hooks/useSmartMatching";
import { useProfile } from "@/hooks/useProfile";
import { useStartConversation, useConversations } from "@/hooks/useMessages";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SmartMatchingPage = () => {
  const queryClient = useQueryClient();
  const { data: matchProfile, isLoading: profileLoading } = useMyMatchProfile();
  const { data: profile } = useProfile();
  const { data: matches = [], isLoading: matchesLoading } = useSmartMatches();
  const upsertProfile = useUpsertMatchProfile();
  const startConversation = useStartConversation();
  const { data: conversations = [] } = useConversations();
  const navigate = useNavigate();

  // Build a map of user_id -> conversation_id for existing conversations
  const existingConvoMap = new Map<string, string>();
  conversations.forEach((c) => {
    if (c.other_user_id) existingConvoMap.set(c.other_user_id, c.id);
  });

  const [optIn, setOptIn] = useState(false);
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [messageTarget, setMessageTarget] = useState<{ user_id: string; display_name: string } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageTarget || !messageText.trim()) return;
    setSending(true);
    try {
      const convoId = await startConversation.mutateAsync({
        otherUserId: messageTarget.user_id,
        initialMessage: messageText.trim(),
      });
      setMessageTarget(null);
      setMessageText("");
      toast.success("Message sent!");
      navigate("/messages");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (matchProfile && !initialized) {
      setOptIn(matchProfile.opt_in);
      setBio(matchProfile.bio ?? "");
      setLookingFor(matchProfile.looking_for ?? "");
      setInitialized(true);
    }
  }, [matchProfile, initialized]);

  const handleToggleOptIn = async (checked: boolean) => {
    setOptIn(checked);
    try {
      await upsertProfile.mutateAsync({ opt_in: checked, bio: bio || null, looking_for: lookingFor || null });
      toast.success(checked ? "You're now visible to matches!" : "Matching disabled.");
    } catch {
      setOptIn(!checked);
      toast.error("Failed to update");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await upsertProfile.mutateAsync({ opt_in: optIn, bio: bio.trim() || null, looking_for: lookingFor.trim() || null });
      toast.success("Match profile saved!");
    } catch {
      toast.error("Failed to save");
    }
  };

  if (profileLoading) {
    return (
      <>
        <PageHeader title="Smart Matching" subtitle="Find your MS community" showBack />
        <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Smart Matching" description="Connect with others who share your MS experience." />
      <PageHeader title="Smart Matching" subtitle="Find your MS community 🤝" showBack />
      <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ["smart-matches"] }); }} className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">

        {/* Opt-in card */}
        <div className="rounded-xl bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-foreground">Find Your Match</h3>
              <p className="text-xs text-muted-foreground">Connect with people who share your MS type and experience.</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Smart Matching</p>
              <p className="text-xs text-muted-foreground">Others can see your anonymous profile</p>
            </div>
            <Switch checked={optIn} onCheckedChange={handleToggleOptIn} />
          </div>

          {optIn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-muted-foreground">Short Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Diagnosed 5 years ago, love hiking and cooking"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  rows={2}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">What are you looking for?</label>
                <textarea
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="e.g. Someone to chat with about fatigue management"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  rows={2}
                  maxLength={200}
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={upsertProfile.isPending}
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {upsertProfile.isPending ? "Saving…" : "Save Profile"}
              </button>
            </motion.div>
          )}
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">Your Privacy</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Only your display name, MS type, age range, and optional bio are shared. Your health data, email, and personal details are never visible to matches.
            </p>
          </div>
        </div>

        {/* Your info */}
        {profile && (
          <div className="rounded-xl bg-card p-4 shadow-soft">
            <h3 className="font-display text-sm font-semibold text-foreground mb-2">Your Match Profile</h3>
            <div className="flex flex-wrap gap-2">
              {profile.ms_type && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{profile.ms_type}</span>
              )}
              {profile.age_range && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground">{profile.age_range}</span>
              )}
              {!profile.ms_type && !profile.age_range && (
                <p className="text-xs text-muted-foreground">
                  Set your MS type and age range in{" "}
                  <Link to="/profile" className="underline underline-offset-2 hover:text-foreground">Profile</Link> to improve matches.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Matches */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold text-foreground">Your Matches</h3>
          </div>

          {matchesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : !optIn ? (
            <p className="text-sm text-muted-foreground text-center py-4">Enable matching above to see people.</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No matches yet — be the first! Others will appear as they opt in.</p>
          ) : (
            <div className="space-y-2">
              {matches.map((match) => (
                <div key={match.user_id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={match.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(match.display_name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{match.display_name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {match.ms_type && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {match.ms_type}
                          {profile?.ms_type === match.ms_type && " ✓"}
                        </span>
                      )}
                      {match.age_range && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{match.age_range}</span>
                      )}
                    </div>
                    {match.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{match.bio}</p>}
                  </div>
                  {existingConvoMap.has(match.user_id) ? (
                    <button
                      onClick={() => navigate("/messages")}
                      className="rounded-full bg-secondary px-3 py-2 text-xs font-medium text-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={() => setMessageTarget({ user_id: match.user_id, display_name: match.display_name })}
                      className="rounded-full bg-primary p-2 text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Send message dialog */}
      <Dialog open={!!messageTarget} onOpenChange={(open) => { if (!open) { setMessageTarget(null); setMessageText(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Message {messageTarget?.display_name}</DialogTitle>
          </DialogHeader>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Say hello! Introduce yourself…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={3}
            maxLength={500}
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !messageText.trim()}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send Message"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmartMatchingPage;
