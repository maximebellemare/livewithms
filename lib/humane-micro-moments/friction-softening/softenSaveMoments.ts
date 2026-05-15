export function softenSaveMoments(text: string) {
  return text
    .replace(/\bsaved\b/gi, "Saved")
    .replace(/\bsee you tomorrow\b/gi, "You can leave this here for now")
    .replace(/\bsmall steps count\b/gi, "That can be enough for now");
}
