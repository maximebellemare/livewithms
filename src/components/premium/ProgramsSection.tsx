import { useState } from "react";
import { BookOpen, Crown, CheckCircle2, Play, ChevronRight, ChevronDown } from "lucide-react";
import PremiumGate from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PROGRAMS, getCompletionMessage } from "@/data/programContent";
import type { ProgramTimer as ProgramTimerType, CountdownTimer } from "@/data/programContent";
import { motion, AnimatePresence } from "framer-motion";
import ProgramTimer from "./ProgramTimer";
import ProgramCountdownTimer from "./ProgramCountdownTimer";
import ListenButton from "@/components/ListenButton";

const ProgramsSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const { data: enrollments = [] } = useQuery({
    queryKey: ["premium_programs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premium_programs")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: dayLogs = [] } = useQuery({
    queryKey: ["program_day_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_day_logs")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.from("premium_programs").insert({
        user_id: user!.id,
        program_id: programId,
        day_number: 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium_programs"] });
      toast.success("Program started! 🎉");
    },
  });

  const completeDayMutation = useMutation({
    mutationFn: async ({ programId, dayNumber }: { programId: string; dayNumber: number }) => {
      await supabase.from("program_day_logs").insert({
        user_id: user!.id,
        program_id: programId,
        day_number: dayNumber,
      });
      const program = PROGRAMS.find((p) => p.id === programId)!;
      const nextDay = Math.min(dayNumber + 1, program.totalDays);
      await supabase
        .from("premium_programs")
        .update({
          day_number: nextDay,
          last_activity_at: new Date().toISOString(),
          ...(nextDay >= program.totalDays ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq("user_id", user!.id)
        .eq("program_id", programId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium_programs"] });
      queryClient.invalidateQueries({ queryKey: ["program_day_logs"] });
      toast(getCompletionMessage());
    },
  });

  return (
    <PremiumGate feature="Structured Programs">
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Programs
            <Crown className="h-3 w-3 text-primary" />
          </span>
        </div>

        {PROGRAMS.map((program) => {
          const enrollment = enrollments.find((e: any) => e.program_id === program.id);
          const completed = dayLogs.filter((d: any) => d.program_id === program.id);
          const isExpanded = expandedProgram === program.id;
          const progress = enrollment ? (completed.length / program.totalDays) * 100 : 0;
          const currentDay = enrollment ? (enrollment as any).day_number : 0;
          const isCompleted = !!(enrollment as any)?.completed_at;

          return (
            <div key={program.id} className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
              <button
                onClick={() => {
                  setExpandedProgram(isExpanded ? null : program.id);
                  setExpandedDay(null);
                }}
                className="flex items-center gap-4 p-4 w-full text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">
                  {program.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{program.title}</p>
                  <p className="text-[11px] text-muted-foreground">{program.duration}</p>
                  {enrollment && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                      <p className="text-xs text-muted-foreground">{program.description}</p>

                      {!enrollment ? (
                        <button
                          onClick={() => enrollMutation.mutate(program.id)}
                          disabled={enrollMutation.isPending}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        >
                          <Play className="h-4 w-4" /> Begin Program
                        </button>
                      ) : isCompleted ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-primary">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm font-semibold">Program Completed! 🎉</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {program.days.slice(0, Math.min(currentDay + 2, program.totalDays)).map((day, i) => {
                            const dayNum = i + 1;
                            const isDone = completed.some((d: any) => d.day_number === dayNum);
                            const isCurrent = dayNum === currentDay;
                            const isDayExpanded = expandedDay === dayNum && expandedProgram === program.id;

                            return (
                              <div
                                key={i}
                                className={`rounded-lg overflow-hidden transition-colors ${
                                  isCurrent ? "bg-accent border border-primary/20" : "bg-secondary/30"
                                }`}
                              >
                                {/* Day header row */}
                                <button
                                  onClick={() => setExpandedDay(isDayExpanded ? null : dayNum)}
                                  className="flex items-center gap-3 px-3 py-2.5 w-full text-left"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                  ) : (
                                    <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${isCurrent ? "border-primary" : "border-muted-foreground/30"}`} />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                      Day {dayNum}: {day.title}
                                    </p>
                                  </div>
                                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isDayExpanded ? "rotate-180" : ""}`} />
                                </button>

                                {/* Expanded day content */}
                                <AnimatePresence>
                                  {isDayExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3 pb-3 pt-1 space-y-2.5 ml-7">
                                        {/* Instructions */}
                                        <p className="text-xs text-foreground leading-relaxed">
                                          {day.instructions}
                                        </p>

                                        {/* Listen button for audio guidance */}
                                        <ListenButton
                                          text={`${day.title}. ${day.instructions}${day.supportLine ? ` ${day.supportLine}` : ""}`}
                                          label="Listen"
                                          className="!-ml-1"
                                        />

                                        {/* Interactive timer */}
                                        {day.timer?.type === "breathing" && (
                                          <ProgramTimer
                                            phases={(day.timer as ProgramTimerType).phases}
                                            cycles={(day.timer as ProgramTimerType).cycles}
                                          />
                                        )}
                                        {day.timer?.type === "countdown" && (
                                          <ProgramCountdownTimer
                                            seconds={(day.timer as CountdownTimer).seconds}
                                            label={(day.timer as CountdownTimer).label}
                                          />
                                        )}

                                        {/* Support line */}
                                        {day.supportLine && (
                                          <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                            {day.supportLine}
                                          </p>
                                        )}

                                        {/* Variation */}
                                        {day.variation && (
                                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            <span className="font-medium text-foreground">Variation:</span> {day.variation}
                                          </p>
                                        )}

                                        {/* Complete button */}
                                        {isCurrent && !isDone && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              completeDayMutation.mutate({ programId: program.id, dayNumber: dayNum });
                                            }}
                                            disabled={completeDayMutation.isPending}
                                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all"
                                          >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Mark as Complete
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </PremiumGate>
  );
};

export default ProgramsSection;
