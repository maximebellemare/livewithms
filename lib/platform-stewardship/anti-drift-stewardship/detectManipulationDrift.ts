export function detectManipulationDrift(text: string) {
  const drifted = /\bmaximize engagement\b|\baddictive loop\b|\bretention first\b|\bemotional leverage\b|\bmonetize vulnerability\b/i.test(
    text,
  );

  return {
    drifted,
    reason: drifted ? "manipulation-drift" : null,
  };
}
