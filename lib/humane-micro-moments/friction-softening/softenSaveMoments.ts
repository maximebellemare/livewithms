export function softenSaveMoments(text: string) {
  return text
    .replace(/\bsaved\b/gi, "Saved")
    .replace(/\bsee you tomorrow\b/gi, "This is here for later")
    .replace(/\bsmall steps count\b/gi, "That can be enough for now");
}
