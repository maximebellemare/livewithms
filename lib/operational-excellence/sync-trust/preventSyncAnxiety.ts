export function preventSyncAnxiety(text: string) {
  return text
    .replace(/\bsync now\b/gi, "sync later")
    .replace(/\byou may lose progress\b/gi, "your updates can try again")
    .replace(/\bconflict detected\b/gi, "a few updates may still be settling")
    .replace(/\bunsynced changes\b/gi, "updates still waiting quietly");
}
