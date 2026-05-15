export function deriveLowPressureTopics(spaces: string[]) {
  return spaces.map((space) =>
    space === "pacing"
      ? "pacing through slower days"
      : space === "fatigue"
        ? "rest and lower-energy stretches"
        : space === "sleep"
          ? "sleep and steadier recovery"
          : space === "cognitive-support"
            ? "brain fog and calmer focus"
            : "recovery rhythms",
  );
}
