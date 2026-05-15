export function validateLongTermRestraint(input: {
  philosophyDrifted: boolean;
  adaptationInflated: boolean;
  overInterpretation: boolean;
}) {
  return {
    valid: !input.philosophyDrifted && !input.adaptationInflated && !input.overInterpretation,
    shouldQuietFurther: input.philosophyDrifted || input.adaptationInflated || input.overInterpretation,
  };
}
