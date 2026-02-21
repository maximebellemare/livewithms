import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  // Joined fields
  other_user_id?: string;
  other_display_name?: string;
  other_avatar_url?: string;
  last_message_body?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      // For each conversation, get the other user's info and last message
      const enriched: Conversation[] = [];
      for (const c of convos) {
        const otherId = c.participant_1 === user!.id ? c.participant_2 : c.participant_1;

        // Get other user's display info
        const { data: profile } = await supabase
          .from("profiles_public")
          .select("display_name, avatar_url")
          .eq("user_id", otherId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("body")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", user!.id);

        enriched.push({
          ...c,
          other_user_id: otherId,
          other_display_name: profile?.display_name || "MS Warrior",
          other_avatar_url: profile?.avatar_url || null,
          last_message_body: lastMsg?.body || null,
          unread_count: count || 0,
        });
      }
      return enriched;
    },
    enabled: !!user,
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mark messages as read when viewing
  useEffect(() => {
    if (!conversationId || !user) return;
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
      });
  }, [conversationId, user, queryClient]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          // Mark new messages as read immediately if we're viewing this convo
          if (user) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("conversation_id", conversationId)
              .neq("sender_id", user.id)
              .eq("is_read", false)
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId && !!user,
    refetchInterval: 30_000, // fallback poll
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user!.id, body })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useStartConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUserId, initialMessage }: { otherUserId: string; initialMessage: string }) => {
      // Canonical ordering: participant_1 < participant_2
      const [p1, p2] = [user!.id, otherUserId].sort();

      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("participant_1", p1)
        .eq("participant_2", p2)
        .maybeSingle();

      let convoId: string;
      if (existing) {
        convoId = existing.id;
      } else {
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ participant_1: p1, participant_2: p2 })
          .select()
          .single();
        if (error) throw error;
        convoId = newConvo.id;
      }

      // Send the initial message
      const { error: msgError } = await supabase
        .from("messages")
        .insert({ conversation_id: convoId, sender_id: user!.id, body: initialMessage });
      if (msgError) throw msgError;

      return convoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useUnreadMessagesCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
};
