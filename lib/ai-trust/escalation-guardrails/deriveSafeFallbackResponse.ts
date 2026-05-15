import type { AiTrustChannel, SensitiveTopic } from "../types";

export function deriveSafeFallbackResponse(channel: AiTrustChannel, sensitiveTopics: SensitiveTopic[]) {
  if (sensitiveTopics.includes("crisis")) {
    return "This sounds like more than reflective support. If you can, reach out to immediate crisis or emergency support, or a trusted person nearby, as soon as you reasonably can.";
  }

  if (sensitiveTopics.includes("medical")) {
    return "I can help you reflect on what stands out, but I cannot interpret symptoms or give medical guidance. A qualified healthcare professional is the right person for that.";
  }

  if (sensitiveTopics.includes("panic") || sensitiveTopics.includes("overwhelm")) {
    return channel === "coach"
      ? "This sounds like a moment to keep very simple. One slow breath, one small next step, and less pressure may be enough for now."
      : "Some recent entries suggest a heavier stretch. A simpler pace and gentler support may matter more right now.";
  }

  if (sensitiveTopics.includes("hopelessness") || sensitiveTopics.includes("despair") || sensitiveTopics.includes("shutdown")) {
    return channel === "coach"
      ? "This sounds like a hard stretch. It may help to keep the next step very small and, if you can, let a trusted real-world support know today feels especially heavy."
      : "Some recent reflections suggest a heavier emotional stretch. Smaller steps and real-world support may matter more than pushing for clarity.";
  }

  return channel === "coach"
    ? "Some recent patterns may be worth noticing gently, without trying to explain everything at once."
    : "These are gentle observations and may not capture the full picture.";
}
