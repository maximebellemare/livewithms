import { useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export type CoachMode = "data" | "emotional" | "planning" | "guidance";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const useCoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<CoachMode>("emotional");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null;
  }, []);

  const loadSession = useCallback(
    async (id: string, sessionMode: CoachMode) => {
      if (!user) return;
      setMode(sessionMode);
      setSessionId(id);
      sessionIdRef.current = id;

      const { data } = await supabase
        .from("coach_messages")
        .select("role, content")
        .eq("session_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
    },
    [user]
  );

  const ensureSession = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (!user) return null;
      if (sessionIdRef.current) return sessionIdRef.current;

      const title = firstMessage.slice(0, 80) || "New conversation";
      const { data, error } = await supabase
        .from("coach_sessions")
        .insert({ user_id: user.id, mode, title })
        .select("id")
        .single();

      if (error || !data) {
        console.error("Failed to create session:", error);
        return null;
      }

      setSessionId(data.id);
      sessionIdRef.current = data.id;
      return data.id;
    },
    [user, mode]
  );

  const persistMessage = useCallback(
    async (sid: string, role: "user" | "assistant", content: string) => {
      if (!user) return;
      await supabase.from("coach_messages").insert({
        session_id: sid,
        user_id: user.id,
        role,
        content,
      });
    },
    [user]
  );

  const sendMessage = useCallback(
    async (input: string, userData?: Record<string, unknown>) => {
      if (!user || !input.trim()) return;

      const userMsg: ChatMessage = { role: "user", content: input.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      // Ensure we have a session
      const sid = await ensureSession(input.trim());

      // Persist user message
      if (sid) {
        persistMessage(sid, "user", input.trim());
      }

      let assistantSoFar = "";
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const resp = await fetch(`${supabaseUrl}/functions/v1/coach-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            mode,
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            sessionId: sid,
            userData,
          }),
        });

        // Handle non-streaming responses (crisis, errors)
        const contentType = resp.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          const json = await resp.json();

          if (json.crisis) {
            const crisisMsg = json.message;
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: crisisMsg },
            ]);
            if (sid) persistMessage(sid, "assistant", crisisMsg);
            setIsLoading(false);
            return;
          }

          if (json.error) {
            if (json.error === "daily_limit") {
              setShowUpgradeNudge(true);
            }
            toast({
              title: json.error === "daily_limit" ? "Daily limit reached" : "Error",
              description: json.message || json.error,
              variant: "destructive",
            });
            setMessages(messages);
            setIsLoading(false);
            return;
          }
        }

        if (!resp.ok || !resp.body) {
          throw new Error("Failed to start stream");
        }

        // Stream SSE
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        const upsertAssistant = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch { /* ignore */ }
          }
        }

        // Persist final assistant message
        if (sid && assistantSoFar) {
          persistMessage(sid, "assistant", assistantSoFar);
        }
      } catch (e) {
        console.error("Coach error:", e);
        toast({
          title: "Connection error",
          description: "Unable to reach the AI coach. Please try again.",
          variant: "destructive",
        });
        setMessages(messages);
      } finally {
        setIsLoading(false);
      }
    },
    [user, messages, mode, toast, ensureSession, persistMessage]
  );

  return {
    messages,
    isLoading,
    mode,
    sessionId,
    showUpgradeNudge,
    setMode,
    sendMessage,
    resetChat,
    loadSession,
  };
};
