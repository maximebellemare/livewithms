export function deriveMinimalRetention() {
  return {
    retainRawBiometrics: false,
    preferDerivedContextOnly: true,
    retainHighResolutionStreams: false,
    summary: "Passive data can stay low-resolution and easy to turn off.",
  };
}
