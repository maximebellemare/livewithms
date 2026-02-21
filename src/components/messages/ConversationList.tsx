import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Conversation } from "@/hooks/useMessages";

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList = ({ conversations, selectedId, onSelect }: Props) => {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Start a conversation from someone's profile in the Community.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
            selectedId === c.id ? "bg-secondary" : ""
          }`}
        >
          {c.other_avatar_url ? (
            <img
              src={c.other_avatar_url}
              alt={c.other_display_name || "User"}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {(c.other_display_name || "?")[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-medium truncate ${c.unread_count ? "text-foreground" : "text-foreground/80"}`}>
                {c.other_display_name}
              </p>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate">
                {c.last_message_body || "No messages yet"}
              </p>
              {!!c.unread_count && c.unread_count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                  {c.unread_count > 9 ? "9+" : c.unread_count}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConversationList;
