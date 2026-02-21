import { useState } from "react";
import { Send, MessageSquarePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStartConversation } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Props {
  targetUserId: string;
  targetDisplayName: string;
  onConversationStarted?: (conversationId: string) => void;
  trigger?: React.ReactNode;
}

const NewMessageDialog = ({ targetUserId, targetDisplayName, onConversationStarted, trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const startConversation = useStartConversation();
  const navigate = useNavigate();

  const handleOpen = async (nextOpen: boolean) => {
    if (nextOpen && user) {
      // Check if user allows DMs
      setChecking(true);
      const { data: allows } = await supabase.rpc("user_allows_dms", { target_user_id: targetUserId });
      setChecking(false);
      if (!allows) {
        toast.error(`${targetDisplayName} has not enabled direct messages.`);
        return;
      }
    }
    setOpen(nextOpen);
  };

  const handleSend = async () => {
    const body = message.trim();
    if (!body) return;
    try {
      const convoId = await startConversation.mutateAsync({
        otherUserId: targetUserId,
        initialMessage: body,
      });
      toast.success("Message sent!");
      setOpen(false);
      setMessage("");
      if (onConversationStarted) {
        onConversationStarted(convoId);
      } else {
        navigate(`/messages?conversation=${convoId}`);
      }
    } catch {
      toast.error("Failed to send message");
    }
  };

  if (!user || user.id === targetUserId) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            disabled={checking}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
          >
            {checking ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <MessageSquarePlus className="h-3.5 w-3.5" />
            )}
            Message
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Message {targetDisplayName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {message.length > 1800 && (
            <p className="text-[10px] text-amber-500">{2000 - message.length} characters remaining</p>
          )}
          <button
            onClick={handleSend}
            disabled={!message.trim() || startConversation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
          >
            {startConversation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {startConversation.isPending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;
