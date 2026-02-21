import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversationMessages, useSendMessage, Conversation } from "@/hooks/useMessages";

interface Props {
  conversation: Conversation;
  onBack: () => void;
}

const MessageThread = ({ conversation, onBack }: Props) => {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useConversationMessages(conversation.id);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const body = newMessage.trim();
    if (!body || body.length > 2000) return;
    sendMessage.mutate({ conversationId: conversation.id, body });
    setNewMessage("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        {conversation.other_avatar_url ? (
          <img
            src={conversation.other_avatar_url}
            alt={conversation.other_display_name || "User"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
            {(conversation.other_display_name || "?")[0].toUpperCase()}
          </div>
        )}
        <p className="text-sm font-semibold text-foreground truncate">{conversation.other_display_name}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Start of your conversation</p>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id;
            const showDate = i === 0 || format(new Date(messages[i - 1].created_at), "MMM d") !== format(new Date(msg.created_at), "MMM d");
            return (
              <div key={msg.id}>
                {showDate && (
                  <p className="text-center text-[10px] text-muted-foreground my-3">
                    {format(new Date(msg.created_at), "MMM d, yyyy")}
                  </p>
                )}
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
          >
            {sendMessage.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {newMessage.length > 1800 && (
          <p className="text-[10px] text-amber-500 mt-1">{2000 - newMessage.length} characters remaining</p>
        )}
      </div>
    </div>
  );
};

export default MessageThread;
