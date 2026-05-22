import { guardEmotionalSupportCopy } from "../../adaptive-intelligence";

const UNSAFE_PROGRAM_LANGUAGE =
  /\b(optimi[sz]e|transform|healing|journey|productivity|bounce back stronger|take your life back|ai companion)\b/gi;

export function guardProgramCalmness(text: string) {
  return guardEmotionalSupportCopy(text)
    .replace(UNSAFE_PROGRAM_LANGUAGE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
