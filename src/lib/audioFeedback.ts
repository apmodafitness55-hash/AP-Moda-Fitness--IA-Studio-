/**
 * Audio Feedback Utility for AP2 Moda Fitness
 * Combines Web Audio API (with proper async AudioContext.resume() awaiting) AND
 * pre-blessed HTMLAudioElement PCM WAV fallbacks so alarms play reliably on Desktop,
 * Android Chrome, installed PWAs, and iOS Safari — even during background polling/SSE events.
 */

type ToneSegment = {
  freq: number;
  freqEnd?: number;
  startSec: number;
  durationSec: number;
  gain: number;
  wave?: 'sine' | 'triangle';
};

const SAMPLE_RATE = 22050;

let sharedAudioCtx: AudioContext | null = null;
let audioUnlockedState = false;
let htmlAudioBlessed = false;
let adminAudioAlertsEnabled = false;
let alarmAudioEl: HTMLAudioElement | null = null;
let sfxAudioEl: HTMLAudioElement | null = null;

export function setAdminAudioAlertsEnabled(enabled: boolean): void {
  adminAudioAlertsEnabled = Boolean(enabled);
}

let silentWavUrl: string | null = null;
let orderAlarmWavUrl: string | null = null;
let saleSuccessWavUrl: string | null = null;
let notificationWavUrl: string | null = null;
let barcodeBeepWavUrl: string | null = null;

const unlockListeners = new Set<(unlocked: boolean) => void>();

function notifyUnlockListeners(unlocked: boolean) {
  unlockListeners.forEach((cb) => {
    try {
      cb(unlocked);
    } catch {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ap-audio-state-change', { detail: { unlocked } }));
  }
}

export function isAudioUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return audioUnlockedState || sharedAudioCtx?.state === 'running' || htmlAudioBlessed;
}

export function onAudioUnlockChange(callback: (unlocked: boolean) => void): () => void {
  unlockListeners.add(callback);
  callback(isAudioUnlocked());
  return () => {
    unlockListeners.delete(callback);
  };
}

/**
 * Generates an in-memory 16-bit mono PCM WAV Blob URL from tone segments.
 */
function buildWavBlobUrl(totalSec: number, segments: ToneSegment[]): string | null {
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
    return null;
  }
  const numSamples = Math.max(1, Math.floor(totalSec * SAMPLE_RATE));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF/WAVE header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    for (const seg of segments) {
      if (t >= seg.startSec && t <= seg.startSec + seg.durationSec) {
        const localT = t - seg.startSec;
        const progress = localT / seg.durationSec;
        const attack = Math.min(1, localT / 0.012);
        const decay = Math.exp(-4.5 * progress);
        const env = attack * decay * seg.gain;
        const freq =
          seg.freqEnd && seg.freqEnd !== seg.freq
            ? seg.freq * Math.pow(seg.freqEnd / seg.freq, progress)
            : seg.freq;
        const phase = 2 * Math.PI * freq * localT;
        let waveVal = Math.sin(phase);
        if (seg.wave === 'triangle') {
          waveVal = (2 / Math.PI) * Math.asin(waveVal);
        }
        // Subtle second harmonic for clearer phone/counter speaker audibility
        sample += (waveVal * 0.8 + Math.sin(phase * 2) * 0.2) * env;
      }
    }

    const clamped = Math.max(-0.95, Math.min(0.95, sample));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function getSilentWavUrl(): string | null {
  if (!silentWavUrl) {
    silentWavUrl = buildWavBlobUrl(0.03, []);
  }
  return silentWavUrl;
}

function getOrderAlarmWavUrl(): string | null {
  if (!orderAlarmWavUrl) {
    orderAlarmWavUrl = buildWavBlobUrl(1.35, [
      { freq: 783.99, startSec: 0.0, durationSec: 0.28, gain: 0.45, wave: 'sine' },
      { freq: 1046.5, startSec: 0.14, durationSec: 0.34, gain: 0.5, wave: 'sine' },
      { freq: 1318.51, startSec: 0.30, durationSec: 0.55, gain: 0.55, wave: 'triangle' },
      { freq: 1975.53, startSec: 0.44, durationSec: 0.85, gain: 0.45, wave: 'sine' },
    ]);
  }
  return orderAlarmWavUrl;
}

function getSaleSuccessWavUrl(): string | null {
  if (!saleSuccessWavUrl) {
    saleSuccessWavUrl = buildWavBlobUrl(1.0, [
      { freq: 1318.51, startSec: 0.0, durationSec: 0.35, gain: 0.42, wave: 'sine' },
      { freq: 1975.53, startSec: 0.12, durationSec: 0.65, gain: 0.5, wave: 'triangle' },
      { freq: 2959.96, startSec: 0.16, durationSec: 0.8, gain: 0.38, wave: 'sine' },
    ]);
  }
  return saleSuccessWavUrl;
}

function getNotificationWavUrl(): string | null {
  if (!notificationWavUrl) {
    notificationWavUrl = buildWavBlobUrl(0.32, [
      { freq: 880, freqEnd: 1760, startSec: 0.0, durationSec: 0.28, gain: 0.35, wave: 'sine' },
    ]);
  }
  return notificationWavUrl;
}

function getBarcodeBeepWavUrl(): string | null {
  if (!barcodeBeepWavUrl) {
    barcodeBeepWavUrl = buildWavBlobUrl(0.1, [
      { freq: 2400, startSec: 0.0, durationSec: 0.085, gain: 0.3, wave: 'sine' },
    ]);
  }
  return barcodeBeepWavUrl;
}

function ensureAudioElements() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  if (!alarmAudioEl) {
    alarmAudioEl = new Audio();
    alarmAudioEl.preload = 'auto';
    alarmAudioEl.setAttribute('playsinline', 'true');
  }
  if (!sfxAudioEl) {
    sfxAudioEl = new Audio();
    sfxAudioEl.preload = 'auto';
    sfxAudioEl.setAttribute('playsinline', 'true');
  }
}

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
        sharedAudioCtx.addEventListener('statechange', () => {
          const running = sharedAudioCtx?.state === 'running';
          if (running && !audioUnlockedState) {
            audioUnlockedState = true;
            notifyUnlockListeners(true);
          } else if (!running && !htmlAudioBlessed && audioUnlockedState) {
            audioUnlockedState = false;
            notifyUnlockListeners(false);
          }
        });
      }
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

async function ensureRunningAudioContext(): Promise<AudioContext | null> {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return null;

  if (ctx.state === 'suspended') {
    try {
      await Promise.race([
        ctx.resume(),
        new Promise<void>((resolve) => setTimeout(resolve, 180)),
      ]);
    } catch {}
  }

  return ctx.state === 'running' ? ctx : null;
}

function blessHtmlAudioElementsSync() {
  if (htmlAudioBlessed) return;
  ensureAudioElements();
  const silentUrl = getSilentWavUrl();
  if (!silentUrl) return;

  for (const el of [alarmAudioEl, sfxAudioEl]) {
    if (!el) continue;
    try {
      el.src = silentUrl;
      el.volume = 0.01;
      const playPromise = el.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            el.pause();
            el.currentTime = 0;
            el.volume = 1.0;
            htmlAudioBlessed = true;
            if (!audioUnlockedState) {
              audioUnlockedState = true;
              notifyUnlockListeners(true);
            }
          })
          .catch(() => {});
      }
    } catch {}
  }
}

async function playHtmlAudioFallback(type: 'alarm' | 'sale' | 'notification' | 'beep'): Promise<boolean> {
  ensureAudioElements();
  const url =
    type === 'alarm'
      ? getOrderAlarmWavUrl()
      : type === 'sale'
        ? getSaleSuccessWavUrl()
        : type === 'notification'
          ? getNotificationWavUrl()
          : getBarcodeBeepWavUrl();

  const el = type === 'alarm' ? alarmAudioEl : sfxAudioEl;
  if (!url || !el) return false;

  try {
    el.pause();
    el.src = url;
    el.currentTime = 0;
    el.volume = 1.0;
    await el.play();
    htmlAudioBlessed = true;
    if (!audioUnlockedState) {
      audioUnlockedState = true;
      notifyUnlockListeners(true);
    }
    return true;
  } catch (err) {
    console.warn(`[AudioFeedback] Fallback HTMLAudio (${type}) bloqueado:`, err);
    return false;
  }
}

/**
 * Call inside a user interaction (click/touch) to unlock Web Audio & bless HTMLAudioElement for future background alarms.
 */
export async function unlockAudioContext(): Promise<boolean> {
  blessHtmlAudioElementsSync();
  const ctx = getOrCreateAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      try {
        await Promise.race([
          ctx.resume(),
          new Promise<void>((resolve) => setTimeout(resolve, 250)),
        ]);
      } catch {}
    }
    if (ctx.state === 'running') {
      // Play a near-silent 10ms impulse so iOS/Android fully opens the hardware audio session
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.015);
      } catch {}
      audioUnlockedState = true;
      notifyUnlockListeners(true);
      return true;
    }
  }
  return isAudioUnlocked();
}

// Keep gesture listeners attached ONLY when admin alerts are enabled and audio is not yet unlocked
if (typeof window !== 'undefined') {
  const onGesture = () => {
    if (!adminAudioAlertsEnabled) return;
    if (htmlAudioBlessed && sharedAudioCtx?.state === 'running') return;
    void unlockAudioContext();
  };
  window.addEventListener('pointerdown', onGesture, { passive: true, capture: true });
  window.addEventListener('touchstart', onGesture, { passive: true, capture: true });
  window.addEventListener('click', onGesture, { passive: true, capture: true });
  window.addEventListener('keydown', onGesture, { passive: true, capture: true });

  document.addEventListener('visibilitychange', () => {
    if (adminAudioAlertsEnabled && document.visibilityState === 'visible' && sharedAudioCtx?.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  });
}

function scheduleOscillators(ctx: AudioContext, segments: ToneSegment[]) {
  const now = ctx.currentTime + 0.01;
  for (const seg of segments) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = seg.wave || 'sine';
    const t0 = now + seg.startSec;
    const t1 = t0 + seg.durationSec;
    osc.frequency.setValueAtTime(seg.freq, t0);
    if (seg.freqEnd && seg.freqEnd !== seg.freq) {
      osc.frequency.exponentialRampToValueAtTime(seg.freqEnd, t1);
    }
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(seg.gain, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

export async function playSaleSuccessSound(): Promise<boolean> {
  try {
    const ctx = await ensureRunningAudioContext();
    if (ctx) {
      scheduleOscillators(ctx, [
        { freq: 1318.51, startSec: 0.0, durationSec: 0.35, gain: 0.38, wave: 'sine' },
        { freq: 1975.53, startSec: 0.12, durationSec: 0.65, gain: 0.48, wave: 'triangle' },
        { freq: 2959.96, startSec: 0.16, durationSec: 0.8, gain: 0.35, wave: 'sine' },
      ]);
      return true;
    }
    return await playHtmlAudioFallback('sale');
  } catch (err) {
    console.warn('Audio feedback failed, trying HTMLAudio fallback:', err);
    return await playHtmlAudioFallback('sale');
  }
}

/**
 * Loud, energetic chime for incoming online orders / confirmed payments.
 */
export async function playOrderAlarmSound(): Promise<boolean> {
  try {
    const ctx = await ensureRunningAudioContext();
    if (ctx) {
      scheduleOscillators(ctx, [
        { freq: 783.99, startSec: 0.0, durationSec: 0.3, gain: 0.42, wave: 'sine' },
        { freq: 1046.5, startSec: 0.15, durationSec: 0.35, gain: 0.48, wave: 'sine' },
        { freq: 1318.51, startSec: 0.32, durationSec: 0.58, gain: 0.52, wave: 'triangle' },
        { freq: 1975.53, startSec: 0.45, durationSec: 0.8, gain: 0.38, wave: 'sine' },
      ]);
      return true;
    }
    return await playHtmlAudioFallback('alarm');
  } catch (err) {
    console.warn('Order alarm audio failed, trying HTMLAudio fallback:', err);
    return await playHtmlAudioFallback('alarm');
  }
}

export async function playBarcodeBeepSound(): Promise<boolean> {
  try {
    const ctx = await ensureRunningAudioContext();
    if (ctx) {
      scheduleOscillators(ctx, [
        { freq: 2400, startSec: 0.0, durationSec: 0.08, gain: 0.22, wave: 'sine' },
      ]);
      return true;
    }
    return await playHtmlAudioFallback('beep');
  } catch (err) {
    console.warn('Barcode beep audio failed:', err);
    return await playHtmlAudioFallback('beep');
  }
}

export async function playNotificationSound(): Promise<boolean> {
  try {
    const ctx = await ensureRunningAudioContext();
    if (ctx) {
      scheduleOscillators(ctx, [
        { freq: 880, freqEnd: 1760, startSec: 0.0, durationSec: 0.25, gain: 0.25, wave: 'sine' },
      ]);
      return true;
    }
    return await playHtmlAudioFallback('notification');
  } catch (err) {
    console.warn('Notification audio failed:', err);
    return await playHtmlAudioFallback('notification');
  }
}
