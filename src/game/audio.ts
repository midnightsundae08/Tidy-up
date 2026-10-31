let audioContext: AudioContext | null = null;

export function playTone(success: boolean, muted: boolean) {
  if (muted) return;
  const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioCtx = window.AudioContext || audioWindow.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    audioContext = audioContext ?? new AudioCtx();
    if (audioContext.state === 'suspended') void audioContext.resume();
    const context = audioContext;
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

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
