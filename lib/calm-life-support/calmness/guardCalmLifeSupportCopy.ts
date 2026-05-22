import { guardEmotionalSupportCopy } from "../../adaptive-intelligence";

const BANNED_LIFE_SUPPORT_LANGUAGE =
  /\b(productivity|therapy|self-help|journey|optimi[sz]e|motivation|life coaching|always here for you|ai companion)\b/gi;

export function guardCalmLifeSupportCopy(text: string) {
  return guardEmotionalSupportCopy(text).replace(BANNED_LIFE_SUPPORT_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}
