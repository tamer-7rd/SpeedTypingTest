import { soundStats } from "./typingTest.js";


// Plays error sound when user types incorrect character
// Uses Web Audio API to generate a beep sound
export function playErrorBeep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!soundStats._audioCtx) soundStats._audioCtx = new AC();
    if (soundStats._audioCtx.state === 'suspended') { soundStats._audioCtx.resume(); }
    const ctx = soundStats._audioCtx;
    const now = ctx.currentTime;
    // Throttle to avoid overlap - prevent multiple beeps too close together
    // Only throttle if we've already played a beep before
    if (soundStats._lastBeepAt > 0 && now - soundStats._lastBeepAt < 0.05) return;
    soundStats._lastBeepAt = now;

    // Create oscillator and gain nodes for sound generation
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now); // low "error" tone (220 Hz)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // ignore audio errors (e.g., autoplay policies, unsupported browsers)
  }
}