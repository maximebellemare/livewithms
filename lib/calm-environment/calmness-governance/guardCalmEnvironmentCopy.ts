const BANNED_ENVIRONMENT_LANGUAGE =
  /\b(immersive|luxury|advanced ui|optimi[sz]e stimulation|dopamine|personalized theme engine|flashy|dramatic)\b/gi;

export function guardCalmEnvironmentCopy(text: string) {
  return text.replace(BANNED_ENVIRONMENT_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}
