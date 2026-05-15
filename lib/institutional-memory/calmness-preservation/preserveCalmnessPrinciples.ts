export function preserveCalmnessPrinciples(input: {
  activeSystems: string[];
  burden: "low" | "moderate" | "high";
}) {
  const principles = [
    "calmness first",
    "reduce intensity under stress",
    "leave room for stepping away",
  ];

  if (input.activeSystems.includes("attention-respect")) {
    principles.push("attention should not be competed for");
  }

  if (input.burden === "high") {
    principles.push("simplify before adding interpretation");
  }

  return principles;
}
