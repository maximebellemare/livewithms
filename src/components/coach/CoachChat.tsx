import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, BarChart3, Heart, Calendar, HelpCircle, ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoach, type CoachMode } from "@/hooks/useCoach";
import { useEntries } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { useRelapses } from "@/hooks/useRelapses";
import { useAuth } from "@/hooks/useAuth";
import { useDbMedications } from "@/hooks/useMedications";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import BreathingTimer, { detectBreathingPattern } from "./BreathingTimer";
import GroundingWidget, { detectGroundingExercise } from "./GroundingWidget";
import CognitiveReframingWidget, { detectCognitiveReframing } from "./CognitiveReframingWidget";
import JournalPromptWidget, { detectJournalingExercise } from "./JournalPromptWidget";
import PMRWidget, { detectPMR } from "./PMRWidget";
import BodyScanWidget, { detectBodyScan } from "./BodyScanWidget";
import VisualizationWidget, { detectVisualization } from "./VisualizationWidget";
import AffirmationCardWidget, { detectAffirmation } from "./AffirmationCardWidget";
import SelfCompassionWidget, { detectSelfCompassion } from "./SelfCompassionWidget";
import StretchingWidget, { detectStretching } from "./StretchingWidget";
import SleepWindDownWidget, { detectSleepWindDown } from "./SleepWindDownWidget";
import MorningCheckInWidget, { detectMorningCheckIn } from "./MorningCheckInWidget";
import MindfulEatingWidget, { detectMindfulEating } from "./MindfulEatingWidget";
import GratitudeWidget, { detectGratitude } from "./GratitudeWidget";
import ValuesWidget, { detectValues } from "./ValuesWidget";
import EmotionalCheckInWidget, { detectEmotionalCheckIn } from "./EmotionalCheckInWidget";
import WorryTimeWidget, { detectWorryTime } from "./WorryTimeWidget";
import ThoughtDefusionWidget, { detectThoughtDefusion } from "./ThoughtDefusionWidget";
import SelfSoothingToolkitWidget, { detectSelfSoothing } from "./SelfSoothingToolkitWidget";
import GuidedMeditationWidget, { detectGuidedMeditation } from "./GuidedMeditationWidget";

interface CoachChatProps {
  mode: CoachMode;
  resumeSessionId?: string | null;
}

const PromptChip = ({ label, onTap }: { label: string; onTap: (v: string) => void }) => (
  <button
    onClick={() => onTap(label)}
    className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-95"
  >
    {label}
  </button>
);

const TypingDots = () => (
  <div className="flex justify-start">
    <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3 flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  </div>
);

const followUpsByMode: Record<string, string[][]> = {
  data: [
    ["What does this mean for my treatment?", "Show me a weekly breakdown", "Compare to last month"],
    ["Which symptom is improving most?", "Are there any concerning trends?", "How does sleep affect my symptoms?"],
  ],
  emotional: [
    ["Guide me through a body scan relaxation", "What's a good coping strategy for today?", "Help me reframe this thought"],
    ["Try a self-compassion exercise with me", "I'd like a 5-4-3-2-1 grounding exercise", "Help me with box breathing"],
  ],
  planning: [
    ["What if I feel worse later?", "Can I fit in a rest break?", "Suggest a lighter version of my plan"],
    ["Help me plan tomorrow too", "What should I prioritise?", "How many spoons does this leave?"],
  ],
  guidance: [
    ["What other features should I try?", "How do I export my data?", "Where do I set up medications?"],
    ["How does the community work?", "Can I track supplements?", "What are badges?"],
  ],
};

const CoachChat = ({ mode, resumeSessionId }: CoachChatProps) => {
  const { messages, isLoading, sendMessage, setMode, resetChat, loadSession, sessionId } = useCoach();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [reactions, setReactions] = useState<Record<number, "up" | "down" | null>>({});
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { user } = useAuth();

  // Load persisted reactions when session loads
  useEffect(() => {
    if (!sessionId || !user) return;
    supabase
      .from("coach_message_reactions")
      .select("message_index, reaction")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const loaded: Record<number, "up" | "down" | null> = {};
          data.forEach((r) => { loaded[r.message_index] = r.reaction as "up" | "down"; });
          setReactions(loaded);
        }
      });
  }, [sessionId, user]);

  const toggleReaction = useCallback(async (idx: number, type: "up" | "down") => {
    const current = reactions[idx];
    const newVal = current === type ? null : type;
    setReactions((prev) => ({ ...prev, [idx]: newVal }));

    if (!sessionId || !user) return;

    if (newVal === null) {
      await supabase
        .from("coach_message_reactions")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("message_index", idx);
    } else {
      await supabase
        .from("coach_message_reactions")
        .upsert(
          { session_id: sessionId, user_id: user.id, message_index: idx, reaction: newVal },
          { onConflict: "user_id,session_id,message_index" }
        );
    }
  }, [reactions, sessionId, user]);

  const { data: entries } = useEntries();
  const { data: profile } = useProfile();
  const { data: relapses } = useRelapses();
  const { data: medications } = useDbMedications();

  // Set mode on mount or resume session
  useEffect(() => {
    if (resumeSessionId) {
      loadSession(resumeSessionId, mode);
    } else {
      setMode(mode);
      resetChat();
    }
  }, [mode, resumeSessionId, setMode, resetChat, loadSession]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll-to-bottom detection
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  // Session summary for resumed conversations
  const sessionSummary = useMemo(() => {
    if (!resumeSessionId || messages.length < 6) return null;
    const firstUserMsg = messages.find((m) => m.role === "user");
    const msgCount = messages.length;
    const userCount = messages.filter((m) => m.role === "user").length;
    return `Resumed conversation · ${userCount} messages from you · Started with "${firstUserMsg?.content.slice(0, 50)}${(firstUserMsg?.content.length || 0) > 50 ? "…" : ""}"`;
  }, [resumeSessionId, messages]);

  // Follow-up suggestions (pick a random set, rotate after each assistant reply)
  const suggestedFollowUps = useMemo(() => {
    const sets = followUpsByMode[mode] || followUpsByMode.data;
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    return sets[assistantCount % sets.length];
  }, [mode, messages]);

  const lastMsgIsAssistant = messages.length > 0 && messages[messages.length - 1]?.role === "assistant";

  const buildUserData = () => {
    const recent30 = (entries || []).slice(0, 30);
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((v): v is number => v != null);
      return valid.length > 0 ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
    };

    const avgFatigue = avg(recent30.map((e) => e.fatigue));
    const avgMood = avg(recent30.map((e) => e.mood));
    const avgSleep = avg(recent30.map((e) => e.sleep_hours ? Number(e.sleep_hours) : null));
    const avgPain = avg(recent30.map((e) => e.pain));
    const avgBrainFog = avg(recent30.map((e) => e.brain_fog));

    const todayEntry = recent30[0];

    // Compute days without entry
    let daysWithoutEntry: number | null = null;
    if (recent30.length > 0) {
      const lastDate = new Date(recent30[0].date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      daysWithoutEntry = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
    }

    // Sleep trend (last 7 vs prior 7)
    let sleepTrend: string | null = null;
    if (recent30.length >= 14) {
      const recent7Sleep = avg(recent30.slice(0, 7).map((e) => e.sleep_hours ? Number(e.sleep_hours) : null));
      const prior7Sleep = avg(recent30.slice(7, 14).map((e) => e.sleep_hours ? Number(e.sleep_hours) : null));
      if (recent7Sleep != null && prior7Sleep != null) {
        const diff = recent7Sleep - prior7Sleep;
        if (Math.abs(diff) >= 0.5) {
          sleepTrend = diff > 0 ? `Improving (+${diff.toFixed(1)}h vs prior week)` : `Declining (${diff.toFixed(1)}h vs prior week)`;
        } else {
          sleepTrend = "Stable";
        }
      }
    }

    // Notable symptom changes (7-day vs 30-day avg)
    const recentSymptomChanges: string[] = [];
    if (recent30.length >= 7) {
      const r7 = recent30.slice(0, 7);
      const r7Fatigue = avg(r7.map((e) => e.fatigue));
      if (r7Fatigue != null && avgFatigue != null && r7Fatigue > avgFatigue + 1.5) {
        recentSymptomChanges.push(`Fatigue trending up (${r7Fatigue.toFixed(1)} vs avg ${avgFatigue.toFixed(1)})`);
      }
      const r7Pain = avg(r7.map((e) => e.pain));
      if (r7Pain != null && avgPain != null && r7Pain > avgPain + 1.5) {
        recentSymptomChanges.push(`Pain trending up (${r7Pain.toFixed(1)} vs avg ${avgPain.toFixed(1)})`);
      }
    }

    // Medication count
    const activeMeds = (medications || []).filter((m) => m.active);

    return {
      msType: profile?.ms_type,
      diagnosisDate: profile?.diagnosis_date || profile?.year_diagnosed,
      symptoms: profile?.symptoms,
      goals: profile?.goals,
      thirtyDayAverages: {
        fatigue: avgFatigue != null ? +avgFatigue.toFixed(1) : null,
        mood: avgMood != null ? +avgMood.toFixed(1) : null,
        sleep: avgSleep != null ? +avgSleep.toFixed(1) : null,
        pain: avgPain != null ? +avgPain.toFixed(1) : null,
        brainFog: avgBrainFog != null ? +avgBrainFog.toFixed(1) : null,
      },
      todayEntry: todayEntry
        ? {
            fatigue: todayEntry.fatigue,
            mood: todayEntry.mood,
            sleep: todayEntry.sleep_hours,
            pain: todayEntry.pain,
            brainFog: todayEntry.brain_fog,
            stress: todayEntry.stress,
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
      activeMedications: activeMeds.map((m) => m.name),
      sleepTrend,
      recentSymptomChanges,
      daysWithoutEntry,
    };
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
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Session summary banner */}
        {sessionSummary && (
          <div className="rounded-xl bg-secondary/50 border border-border px-3 py-2 mb-1">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{sessionSummary}</p>
          </div>
        )}
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
                  <PromptChip label="Guide me through box breathing" onTap={setInput} />
                  <PromptChip label="I need a grounding exercise" onTap={setInput} />
                  <PromptChip label="Help me reframe a negative thought" onTap={setInput} />
                   <PromptChip label="Guide me through a journaling prompt" onTap={setInput} />
                   <PromptChip label="Try progressive muscle relaxation" onTap={setInput} />
                   <PromptChip label="Guide me through a body scan" onTap={setInput} />
                   <PromptChip label="Try a visualization exercise" onTap={setInput} />
                   <PromptChip label="Show me some positive affirmations" onTap={setInput} />
                   <PromptChip label="Guide me through a self-compassion break" onTap={setInput} />
                   <PromptChip label="Try a gentle stretching routine" onTap={setInput} />
                   <PromptChip label="Try a sleep wind-down routine" onTap={setInput} />
                   <PromptChip label="Try a morning check-in routine" onTap={setInput} />
                   <PromptChip label="Try a mindful eating exercise" onTap={setInput} />
                   <PromptChip label="Try a gratitude journaling exercise" onTap={setInput} />
                   <PromptChip label="Try a values clarification exercise" onTap={setInput} />
                   <PromptChip label="Do an emotional check-in" onTap={setInput} />
                   <PromptChip label="Try a worry time exercise" onTap={setInput} />
                   <PromptChip label="Try a thought defusion exercise" onTap={setInput} />
                   <PromptChip label="Try a self-soothing toolkit" onTap={setInput} />
                   <PromptChip label="Try a guided meditation" onTap={setInput} />
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
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {(() => {
                    if (detectPMR(msg.content)) return <PMRWidget />;
                    if (detectBodyScan(msg.content)) return <BodyScanWidget />;
                    if (detectValues(msg.content)) return <ValuesWidget />;
                    if (detectEmotionalCheckIn(msg.content)) return <EmotionalCheckInWidget />;
                    if (detectWorryTime(msg.content)) return <WorryTimeWidget />;
                    if (detectThoughtDefusion(msg.content)) return <ThoughtDefusionWidget />;
                    if (detectSelfSoothing(msg.content)) return <SelfSoothingToolkitWidget />;
                    if (detectGuidedMeditation(msg.content)) return <GuidedMeditationWidget />;
                    if (detectGratitude(msg.content)) return <GratitudeWidget />;
                    if (detectMindfulEating(msg.content)) return <MindfulEatingWidget />;
                    if (detectMorningCheckIn(msg.content)) return <MorningCheckInWidget />;
                    if (detectSleepWindDown(msg.content)) return <SleepWindDownWidget />;
                    if (detectStretching(msg.content)) return <StretchingWidget />;
                    if (detectSelfCompassion(msg.content)) return <SelfCompassionWidget />;
                    if (detectVisualization(msg.content)) return <VisualizationWidget />;
                    if (detectAffirmation(msg.content)) return <AffirmationCardWidget />;
                    if (detectJournalingExercise(msg.content)) return <JournalPromptWidget />;
                    if (detectCognitiveReframing(msg.content)) return <CognitiveReframingWidget />;
                    if (detectGroundingExercise(msg.content)) return <GroundingWidget />;
                    const bp = detectBreathingPattern(msg.content);
                    if (bp) return <BreathingTimer pattern={bp} />;
                    return null;
                    })()}
                  </>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1 ml-1">
                  <button
                    onClick={() => toggleReaction(i, "up")}
                    className={`p-1 rounded-md transition-colors ${
                      reactions[i] === "up"
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary"
                    }`}
                    aria-label="Helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleReaction(i, "down")}
                    className={`p-1 rounded-md transition-colors ${
                      reactions[i] === "down"
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary"
                    }`}
                    aria-label="Not helpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <TypingDots />
        )}

        {/* Suggested follow-ups */}
        {lastMsgIsAssistant && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-1.5 pt-1"
          >
            {suggestedFollowUps.map((s) => (
              <PromptChip key={s} label={s} onTap={(v) => {
                setInput(v);
                setTimeout(() => inputRef.current?.focus(), 50);
              }} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border shadow-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

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
