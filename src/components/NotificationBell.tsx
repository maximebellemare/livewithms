import { useState, useRef, useCallback } from "react";
import { Bell, MessageCircle, Heart, Bookmark, Check, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SwipeableNotificationProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    post_id: string | null;
    is_read: boolean;
    created_at: string;
  };
  onClick: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = 80;

const SwipeableNotification = ({ notification: n, onClick, onDelete }: SwipeableNotificationProps) => {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Only allow swiping left
    if (diff < 0) {
      setOffset(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
    if (offset < -SWIPE_THRESHOLD) {
      // Animate out and delete
      setDismissed(true);
      setTimeout(() => onDelete(), 250);
    } else {
      setOffset(0);
    }
  }, [offset, onDelete]);

  if (dismissed) {
    return (
      <div className="overflow-hidden transition-all duration-250 ease-out" style={{ maxHeight: 0, opacity: 0 }} />
    );
  }

  return (
    <div className="relative overflow-hidden border-b border-border/50">
      {/* Delete background revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive px-4">
        <Trash2 className="h-4 w-4 text-destructive-foreground" />
      </div>
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
        className={`relative z-10 w-full text-left px-3 py-2.5 transition-colors cursor-pointer ${
          !n.is_read ? "bg-primary/5" : "bg-popover"
        }`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? "none" : "transform 0.2s ease-out",
        }}
      >
        <div className="flex items-start gap-2">
          {n.type === "like" ? (
            <Heart className={`h-4 w-4 mt-0.5 shrink-0 ${!n.is_read ? "text-red-500" : "text-muted-foreground"}`} />
          ) : n.type === "bookmark" ? (
            <Bookmark className={`h-4 w-4 mt-0.5 shrink-0 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
          ) : (
            <MessageCircle className={`h-4 w-4 mt-0.5 shrink-0 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-xs leading-snug ${!n.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {n.title}
            </p>
            {n.body && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>
            )}
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!n.is_read && (
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationBell = () => {
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearAllNotifications();
  const deleteOne = useDeleteNotification();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = (n: (typeof notifications)[0]) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.post_id) {
      setOpen(false);
      navigate("/community");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-1.5">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1 text-[11px] text-destructive hover:underline">
                    <Trash2 className="h-3 w-3" /> Clear all
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your notifications. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearAll.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <SwipeableNotification
                key={n.id}
                notification={n}
                onClick={() => handleClick(n)}
                onDelete={() => deleteOne.mutate(n.id)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
