import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export interface CognitiveSession {
  id: string;
  user_id: string;
  game_type: string;
  score: number;
  duration_seconds: number;
  details: Record<string, any>;
  played_at: string;
  created_at: string;
}

export function useCognitiveSessions(days = 30) {
  const { user } = useAuth();
  const start = format(new Date(Date.now() - (days - 1) * 86400000), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["cognitive-sessions", user?.id, start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cognitive_sessions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .gte("played_at", start)
        .order("played_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CognitiveSession[];
    },
    enabled: !!user,
  });
}

export function useSaveSession() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (session: {

      game_type: string;
      score: number;
      duration_seconds: number;
      details?: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("cognitive_sessions" as any)
        .insert({
          user_id: user!.id,
          game_type: session.game_type,
          score: session.score,
          duration_seconds: session.duration_seconds,
          details: session.details ?? {},
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cognitive-sessions"] });
      const messages = [
        "Nice. Even a short reset helps. 🌿",
        "That was a good pause. ☀️",
        "A moment well spent. 💛",
        "Your brain thanks you. 🧠",
      ];
      import("sonner").then(({ toast }) => {
        toast(messages[Math.floor(Math.random() * messages.length)]);
      });
    },
  });
}

export function useBestScores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cognitive-best-scores", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cognitive_sessions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("score", { ascending: false });
      if (error) throw error;
      const sessions = (data ?? []) as unknown as CognitiveSession[];
      const best: Record<string, CognitiveSession> = {};
      for (const s of sessions) {
        if (!best[s.game_type] || s.score > best[s.game_type].score) {
          best[s.game_type] = s;
        }
      }
      return best;
    },
    enabled: !!user,
  });
}
