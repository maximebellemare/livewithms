import { useUserAvatar } from "@/hooks/useUserAvatar";

interface CommunityAvatarProps {
  userId: string;
  displayName: string;
  size?: "sm" | "md";
}

export const CommunityAvatar = ({ userId, displayName, size = "sm" }: CommunityAvatarProps) => {
  const { data: avatarUrl } = useUserAvatar(userId);

  const sizeClasses = size === "md"
    ? "h-8 w-8 text-xs"
    : "h-6 w-6 text-[10px]";

  const initial = (displayName || "?")[0].toUpperCase();

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={displayName}
      className={`${sizeClasses} rounded-full object-cover shrink-0`}
    />
  ) : (
    <span className={`${sizeClasses} flex items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold shrink-0`}>
      {initial}
    </span>
  );
};
