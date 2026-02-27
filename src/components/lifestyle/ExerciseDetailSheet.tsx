import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, Loader2, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface ExerciseInfo {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  instruction?: string;
  steps?: string[];
  muscle_group?: string;
}

interface Props {
  exercise: ExerciseInfo | null;
  onClose: () => void;
  msType?: string | null;
}

const MUSCLE_GROUP_ANIMATIONS: Record<string, { emoji: string; label: string; colors: string }> = {
  upper_body: { emoji: "💪", label: "Upper Body", colors: "from-blue-500/20 to-indigo-500/20" },
  lower_body: { emoji: "🦵", label: "Lower Body", colors: "from-green-500/20 to-emerald-500/20" },
  core: { emoji: "🎯", label: "Core", colors: "from-orange-500/20 to-amber-500/20" },
  full_body: { emoji: "🏋️", label: "Full Body", colors: "from-purple-500/20 to-pink-500/20" },
  cardio: { emoji: "❤️", label: "Cardio", colors: "from-red-500/20 to-rose-500/20" },
  flexibility: { emoji: "🧘", label: "Flexibility", colors: "from-teal-500/20 to-cyan-500/20" },
};

/** Fetch an exercise image from the free wger.de API */
async function fetchExerciseImage(name: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(name)}&language=english&format=json`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    const suggestions = searchData?.suggestions || [];
    // Find the first suggestion that has an image
    for (const suggestion of suggestions) {
      if (suggestion?.data?.image) {
        return `https://wger.de${suggestion.data.image}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default function ExerciseDetailSheet({ exercise, onClose, msType }: Props) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [exerciseImageUrl, setExerciseImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Fetch exercise image when the exercise changes
  useEffect(() => {
    if (!exercise) return;
    setExerciseImageUrl(null);
    setImageFailed(false);
    setImageLoading(true);
    setAiExplanation(null);

    fetchExerciseImage(exercise.name).then((url) => {
      setExerciseImageUrl(url);
      setImageLoading(false);
      if (!url) setImageFailed(true);
    });
  }, [exercise?.name]);

  if (!exercise) return null;

  const mg = MUSCLE_GROUP_ANIMATIONS[exercise.muscle_group || "full_body"] || MUSCLE_GROUP_ANIMATIONS.full_body;

  const askCoach = async () => {
    setLoadingAi(true);
    setAiExplanation(null);
    try {
      const { data, error } = await supabase.functions.invoke("exercise-correlation", {
        body: {
          mode: "coach_chat",
          msType,
          chatMessages: [
            {
              role: "user",
              content: `Explain in detail how to properly perform "${exercise.name}" with correct form. Include:
1. Starting position
2. Step-by-step movement
3. Common mistakes to avoid
4. MS-specific modifications (for balance, fatigue, or limited mobility)
5. Breathing pattern
Keep it friendly, concise, and practical.`,
            },
          ],
        },
      });
      if (error) throw error;
      setAiExplanation(data?.reply || "No response received.");
    } catch {
      setAiExplanation("Sorry, I couldn't get an explanation right now. Try again later.");
    } finally {
      setLoadingAi(false);
    }
  };

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 w-full max-w-lg mx-auto bg-card rounded-t-2xl shadow-lg max-h-[85vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-bold text-foreground">{exercise.name}</h3>
              {(exercise.sets || exercise.reps) && (
                <p className="text-xs text-muted-foreground">
                  {exercise.sets && `${exercise.sets} sets`}
                  {exercise.reps && ` · ${exercise.reps}`}
                  {exercise.rest && ` · Rest: ${exercise.rest}`}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Exercise Image or Muscle Group Fallback */}
          <div className={`rounded-xl bg-gradient-to-br ${mg.colors} p-3 flex items-center justify-center min-h-[140px] overflow-hidden`}>
            {imageLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
                <p className="text-[10px] text-foreground/50">Loading illustration…</p>
              </div>
            ) : exerciseImageUrl && !imageFailed ? (
              <img
                src={exerciseImageUrl}
                alt={`${exercise.name} demonstration`}
                className="max-h-[180px] w-auto rounded-lg object-contain"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="text-center space-y-1">
                {imageFailed && (
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ImageOff className="h-3 w-3 text-foreground/40" />
                    <p className="text-[9px] text-foreground/40">No illustration found</p>
                  </div>
                )}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 3, -3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-4xl"
                >
                  {mg.emoji}
                </motion.div>
                <p className="text-[10px] font-semibold text-foreground/70">{mg.label}</p>
              </div>
            )}
          </div>

          {/* Form Tip */}
          {exercise.instruction && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
              <p className="text-xs text-foreground">
                <span className="font-semibold">💡 Form tip:</span> {exercise.instruction}
              </p>
            </div>
          )}

          {/* Step-by-step Instructions */}
          {exercise.steps && exercise.steps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">📋 Step-by-Step</h4>
              <div className="space-y-1.5">
                {exercise.steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ask AI Coach */}
          <div className="space-y-2">
            <button
              onClick={askCoach}
              disabled={loadingAi}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60 transition-all"
            >
              {loadingAi ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5" />
              )}
              {loadingAi ? "Asking coach…" : "Ask AI Coach how to do this"}
            </button>

            {aiExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg bg-secondary/50 p-3 overflow-hidden"
              >
                <div className="prose prose-sm max-w-none text-xs text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_strong]:text-foreground">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
