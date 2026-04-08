import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, X, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useFitnessCoachLimit } from "@/hooks/useFitnessCoachLimit";
import { AnimatePresence } from "framer-motion";
import FitnessLimitOverlay from "./FitnessLimitOverlay";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  planContext: any;
  exerciseLogs: any[];
  symptomEntries: any[];
  msType: string | null;
}

const SUGGESTED_QUESTIONS = [
  "How can I modify my plan for a high-fatigue day?",
  "What exercises can I swap if my legs feel weak?",
  "Is my current plan safe during a flare-up?",
  "How should I progress over the next month?",
];

export default function FitnessCoachChat({ planContext, exerciseLogs, symptomEntries, msType }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { limitReached, remaining, isPremium, recordMessage } = useFitnessCoachLimit();
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    if (limitReached) {
      setShowLimitOverlay(true);
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("exercise-correlation", {
        body: {
          mode: "coach_chat",
          chatMessages: newMessages,
          planContext,
          exerciseLogs: exerciseLogs.slice(0, 14).map((l) => ({
            date: l.date, type: l.type, duration: l.duration_minutes, intensity: l.intensity,
          })),
          symptomEntries: symptomEntries.slice(-7),
          msType,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const reply = typeof data === "string" ? data : data?.reply || data?.content || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      const hitLimit = recordMessage();
      if (hitLimit) {
        setTimeout(() => setShowLimitOverlay(true), 800);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to get a response");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
      >
        <MessageCircle className="h-3.5 w-3.5" /> Chat with Coach
      </button>
    );
  }

  return (
    <div className="relative rounded-xl bg-card border border-border shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary/5 px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">AI Fitness Coach</span>
          {!isPremium && (
            <span className="text-[10px] text-muted-foreground ml-1">
              {limitReached ? "Limit reached" : `${remaining} left today`}
            </span>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-64 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              {isPremium
                ? "Ask me anything about your plan, exercises, or MS fitness! 💪"
                : "Ask a question about movement or energy — I'm here to help 🌿"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={limitReached}
                  className="text-[10px] rounded-full bg-secondary px-2.5 py-1 text-foreground hover:bg-muted transition-all text-left disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-1.5 [&_li]:text-xs [&_strong]:text-foreground [&_ul]:mt-1 [&_ul]:mb-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-secondary px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-2 flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder={limitReached ? "Daily limit reached" : "Ask about your plan…"}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          maxLength={500}
          disabled={loading || limitReached}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim() || limitReached}
          className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Limit overlay */}
      <AnimatePresence>
        {showLimitOverlay && (
          <FitnessLimitOverlay onDismiss={() => setShowLimitOverlay(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
