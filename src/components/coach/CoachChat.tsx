import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BarChart3, Heart, Calendar, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoach, type CoachMode } from "@/hooks/useCoach";
import { useEntries } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { useRelapses } from "@/hooks/useRelapses";
import ReactMarkdown from "react-markdown";

interface CoachChatProps {
  mode: CoachMode;
}

const PromptChip = ({ label, onTap }: { label: string; onTap: (v: string) => void }) => (
  <button
    onClick={() => onTap(label)}
    className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-95"
  >
    {label}
  </button>
);

const CoachChat = ({ mode }: CoachChatProps) => {
  const { messages, isLoading, sendMessage, setMode, resetChat } = useCoach();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: entries } = useEntries();
  const { data: profile } = useProfile();
  const { data: relapses } = useRelapses();

  // Set mode on mount
  useEffect(() => {
    setMode(mode);
    resetChat();
  }, [mode, setMode, resetChat]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildUserData = () => {
    if (mode === "data" || mode === "planning") {
      const recent30 = (entries || []).slice(0, 30);
      const avgFatigue = recent30.filter((e) => e.fatigue != null).reduce((s, e) => s + (e.fatigue || 0), 0) / Math.max(recent30.filter((e) => e.fatigue != null).length, 1);
      const avgMood = recent30.filter((e) => e.mood != null).reduce((s, e) => s + (e.mood || 0), 0) / Math.max(recent30.filter((e) => e.mood != null).length, 1);
      const avgSleep = recent30.filter((e) => e.sleep_hours != null).reduce((s, e) => s + (e.sleep_hours || 0), 0) / Math.max(recent30.filter((e) => e.sleep_hours != null).length, 1);
      const avgPain = recent30.filter((e) => e.pain != null).reduce((s, e) => s + (e.pain || 0), 0) / Math.max(recent30.filter((e) => e.pain != null).length, 1);
      const avgBrainFog = recent30.filter((e) => e.brain_fog != null).reduce((s, e) => s + (e.brain_fog || 0), 0) / Math.max(recent30.filter((e) => e.brain_fog != null).length, 1);

      const todayEntry = recent30[0];

      return {
        msType: profile?.ms_type,
        diagnosisDate: profile?.diagnosis_date || profile?.year_diagnosed,
        symptoms: profile?.symptoms,
        goals: profile?.goals,
        thirtyDayAverages: {
          fatigue: +avgFatigue.toFixed(1),
          mood: +avgMood.toFixed(1),
          sleep: +avgSleep.toFixed(1),
          pain: +avgPain.toFixed(1),
          brainFog: +avgBrainFog.toFixed(1),
        },
        todayEntry: todayEntry
          ? {
              fatigue: todayEntry.fatigue,
              mood: todayEntry.mood,
              sleep: todayEntry.sleep_hours,
              pain: todayEntry.pain,
              brainFog: todayEntry.brain_fog,
            }
          : null,
        totalRelapses: (relapses || []).length,
        recentRelapses: (relapses || []).slice(0, 3).map((r) => ({
          startDate: r.start_date,
          severity: r.severity,
          symptoms: r.symptoms,
          recovered: r.is_recovered,
        })),
        entriesLogged: recent30.length,
      };
    }
    return undefined;
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userData = buildUserData();
    sendMessage(input, userData);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              {mode === "data" && <BarChart3 className="h-6 w-6 text-primary" />}
              {mode === "emotional" && <Heart className="h-6 w-6 text-primary" />}
              {mode === "planning" && <Calendar className="h-6 w-6 text-primary" />}
              {mode === "guidance" && <HelpCircle className="h-6 w-6 text-primary" />}
            </div>
            {mode === "data" && (
              <div className="space-y-2 max-w-xs">
                <p className="text-sm font-medium text-foreground">Understand Your Data</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask me about your symptom trends, patterns, or what your tracked data means.
                </p>
              </div>
            )}
            {mode === "emotional" && (
              <div className="space-y-2 max-w-xs">
                <p className="text-sm font-medium text-foreground">Talk About How You're Feeling</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share what's on your mind — I'll listen and offer gentle, supportive guidance.
                </p>
              </div>
            )}
            {mode === "planning" && (
              <div className="space-y-2 max-w-xs">
                <p className="text-sm font-medium text-foreground">Plan Your Day</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tell me what you have planned and I'll help you pace your energy using Spoon Theory.
                </p>
              </div>
            )}
            {mode === "guidance" && (
              <div className="space-y-2 max-w-xs">
                <p className="text-sm font-medium text-foreground">App Guide</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask me how to use any feature and I'll walk you through it step by step.
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-5 max-w-sm">
              {mode === "data" && (
                <>
                  <PromptChip label="How has my fatigue been this month?" onTap={setInput} />
                  <PromptChip label="Do my symptoms connect to sleep?" onTap={setInput} />
                  <PromptChip label="Summarise my recent trends" onTap={setInput} />
                </>
              )}
              {mode === "emotional" && (
                <>
                  <PromptChip label="I'm feeling overwhelmed today" onTap={setInput} />
                  <PromptChip label="Help me with a breathing exercise" onTap={setInput} />
                  <PromptChip label="I need a journaling prompt" onTap={setInput} />
                </>
              )}
              {mode === "planning" && (
                <>
                  <PromptChip label="I have errands and a doctor visit today" onTap={setInput} />
                  <PromptChip label="My fatigue is high — what should I skip?" onTap={setInput} />
                  <PromptChip label="Help me prioritise my tasks" onTap={setInput} />
                </>
              )}
              {mode === "guidance" && (
                <>
                  <PromptChip label="How do I track supplements?" onTap={setInput} />
                  <PromptChip label="Where can I see my reports?" onTap={setInput} />
                  <PromptChip label="What are cognitive games?" onTap={setInput} />
                </>
              )}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Disclaimer bar */}
      <div className="px-4 py-1">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          AI support only — not a substitute for professional medical care
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity active:scale-95"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachChat;
