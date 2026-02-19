import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const AvatarUpload = ({ currentUrl }: { currentUrl: string | null }) => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-bust to ensure fresh image
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfile.mutateAsync({ avatar_url: publicUrl } as any);
      queryClient.invalidateQueries({ queryKey: ["user-avatar", user.id] });
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <button
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      className="relative group"
    >
      {currentUrl ? (
        <img
          src={currentUrl}
          alt="Profile"
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl">
          🧡
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Camera className="h-4 w-4 text-white" />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </button>
  );
};
