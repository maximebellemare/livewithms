/**
 * Plays a gentle bell/chime sound using the Web Audio API.
 * No external files or network requests needed.
 */
export function playCompletionChime() {
  try {
    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Three ascending bell tones — warm and gentle
    playTone(523.25, now, 1.2, 0.15);        // C5
    playTone(659.25, now + 0.15, 1.0, 0.12); // E5
    playTone(783.99, now + 0.35, 1.4, 0.10); // G5

    // Clean up after sounds finish
    setTimeout(() => ctx.close(), 3000);
  } catch {
    // Silently fail if Web Audio API isn't available
  }
}
