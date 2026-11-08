/**
 * Audio Feedback Utility using Web Audio API for AP Moda Fitness
 * Generates clear, high-quality audio chimes for sales, scans, and notifications.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Call on any initial user interaction (click/touch) to ensure browser audio policies allow background alarms.
 */
export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Auto-unlock on first user gesture anywhere
if (typeof window !== 'undefined') {
  const onGesture = () => {
    unlockAudioContext();
    window.removeEventListener('click', onGesture);
    window.removeEventListener('touchstart', onGesture);
    window.removeEventListener('keydown', onGesture);
  };
  window.addEventListener('click', onGesture, { passive: true });
  window.addEventListener('touchstart', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture, { passive: true });
}

export function playSaleSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // First bright chime (E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second metallic "Cha-Ching" chord (B6 + F#7)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, now + 0.12);
    gain2.gain.setValueAtTime(0.45, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.75);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2959.96, now + 0.16);
    gain3.gain.setValueAtTime(0.35, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.95);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}

/**
 * Loud, energetic chime specifically for incoming online orders that need packaging and dispatch.
 * Two ascending tones + cheerful cash register bell.
 */
export function playOrderAlarmSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: High alert bell (G5)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(783.99, now);
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    o1.connect(g1);
    g1.connect(ctx.destination);
    o1.start(now);
    o1.stop(now + 0.3);

    // Tone 2: Ascending bell (C6)
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1046.50, now + 0.15);
    g2.gain.setValueAtTime(0.45, now + 0.15);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(now + 0.15);
    o2.stop(now + 0.5);

    // Tone 3: Bright chime (E6)
    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = 'triangle';
    o3.frequency.setValueAtTime(1318.51, now + 0.32);
    g3.gain.setValueAtTime(0.5, now + 0.32);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    o3.connect(g3);
    g3.connect(ctx.destination);
    o3.start(now + 0.32);
    o3.stop(now + 0.9);

    // Tone 4: High shimmer (B6)
    const o4 = ctx.createOscillator();
    const g4 = ctx.createGain();
    o4.type = 'sine';
    o4.frequency.setValueAtTime(1975.53, now + 0.45);
    g4.gain.setValueAtTime(0.35, now + 0.45);
    g4.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    o4.connect(g4);
    g4.connect(ctx.destination);
    o4.start(now + 0.45);
    o4.stop(now + 1.2);
  } catch (err) {
    console.warn('Order alarm audio failed:', err);
  }
}

export function playBarcodeBeepSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.warn('Barcode beep audio failed:', err);
  }
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (err) {
    console.warn('Notification audio failed:', err);
  }
}
