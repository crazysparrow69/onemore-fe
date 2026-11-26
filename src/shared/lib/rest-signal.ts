const SOUND_KEY = 'onemore.rest-sound';
const BEEP_COUNT = 3;
const BEEP_GAP_S = 0.28;
const BEEP_LENGTH_S = 0.16;
const BEEP_HZ = 880;
const VIBRATION_MS = [200, 100, 200, 100, 200];

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) {
    return context;
  }
  const host = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = host.AudioContext ?? host.webkitAudioContext;
  context = Ctor ? new Ctor() : null;
  return context;
}

export function restSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setRestSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    return;
  }
}

export function unlockRestAudio(): void {
  try {
    void audioContext()?.resume();
  } catch {
    return;
  }
}

function beep(ctx: AudioContext): void {
  const start = ctx.currentTime;
  for (let index = 0; index < BEEP_COUNT; index += 1) {
    const at = start + index * BEEP_GAP_S;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = BEEP_HZ;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + BEEP_LENGTH_S);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + BEEP_LENGTH_S + 0.02);
  }
}

export function playRestSignal(): void {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(VIBRATION_MS);
    }
  } catch {
    return;
  }
  if (!restSoundEnabled()) {
    return;
  }
  try {
    const ctx = audioContext();
    if (ctx) {
      void ctx.resume().then(() => {
        beep(ctx);
      });
    }
  } catch {
    return;
  }
}
