import { useState, useCallback } from "react";
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

  const resetChat = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (input: string, userData?: Record<string, unknown>) => {
      if (!user || !input.trim()) return;

      const userMsg: ChatMessage = { role: "user", content: input.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

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
            userData,
          }),
        });

        // Handle non-streaming responses (crisis, errors)
        const contentType = resp.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          const json = await resp.json();

          if (json.crisis) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: json.message },
            ]);
            setIsLoading(false);
            return;
          }

          if (json.error) {
            toast({
              title: json.error === "daily_limit" ? "Daily limit reached" : "Error",
              description: json.message || json.error,
              variant: "destructive",
            });
            // Remove the user message we optimistically added
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
    [user, messages, mode, toast]
  );

  return {
    messages,
    isLoading,
    mode,
    setMode,
    sendMessage,
    resetChat,
  };
};
