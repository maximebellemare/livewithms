type Input = {
  localeHint?: "global" | "direct" | "gentle";
  lowEnergy?: boolean;
};

export function deriveCulturalSupportPacing({ localeHint = "global", lowEnergy = false }: Input) {
  const gentlerPacing = localeHint === "gentle" || lowEnergy;

  return {
    pacing: gentlerPacing ? "gentle" : "steady",
    summary: gentlerPacing
      ? "Support can stay softer and less abrupt when more emotional room helps."
      : "Support can stay respectful without becoming overly forceful or overly familiar.",
  };
}
