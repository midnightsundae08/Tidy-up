let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioCtx = window.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = audioContext ?? new AudioCtx();
    return audioContext;
  } catch {
    audioContext = null;
    return null;
  }
}

/** Call from a click or key handler so the browser allows playback. */
export function resumeAudio(): Promise<void> {
  const context = getAudioContext();
  if (!context || context.state !== 'suspended') return Promise.resolve();
  return context.resume().then(() => undefined);
}

export function playTone(success: boolean, muted: boolean) {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;
  try {
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    const notes = success ? [540, 720] : [220];
    notes.forEach((frequency, index) => {
      const osc = context.createOscillator();
      const amp = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      amp.gain.setValueAtTime(0.0001, now + index * 0.08);
      amp.gain.exponentialRampToValueAtTime(0.08, now + index * 0.08 + 0.014);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.19);
      osc.connect(amp);
      amp.connect(context.destination);
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.2);
    });
  } catch {
    audioContext = null;
  }
}

/** A short major arpeggio, separate from the two-note place chime. */
export function playFanfare(muted: boolean) {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;
  try {
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      const osc = context.createOscillator();
      const amp = context.createGain();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      const start = now + index * 0.12;
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.46);
      osc.connect(amp);
      amp.connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.48);
    });
  } catch {
    audioContext = null;
  }
}

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
