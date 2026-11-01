import { getAudioContext } from './audio';

export const THEME_TRACK = 'TidyUp Theme.mp3';

export const GAMEPLAY_TRACKS = [
  'TidyUp (Extended).mp3',
  'TidyUp (LoFi Mix).mp3',
  'TidyUp Theme (Slow).mp3',
] as const;

const ALL_TRACKS = [THEME_TRACK, ...GAMEPLAY_TRACKS];

/** Full bed level. Round-end ducks this to half. */
const MUSIC_LEVEL = 0.4;

type Bed = 'idle' | 'theme' | 'gameplay';

let musicGain: GainNode | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentTrack: string | null = null;
let upcoming: string[] = [];
let mode: Bed = 'idle';
let muted = false;
let ducked = false;
const buffers = new Map<string, AudioBuffer>();

export function trackUrl(name: string): string {
  const base = import.meta.env.BASE_URL || './';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}assets/${encodeURIComponent(name)}`;
}

/** Shuffle `tracks`, keeping `avoid` off the front when there is another choice. */
export function shuffledPlaylist(tracks: readonly string[], avoid: string | null, random: () => number = Math.random): string[] {
  const copy = [...tracks];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (avoid && copy.length > 1 && copy[0] === avoid) {
    const j = 1 + Math.floor(random() * (copy.length - 1));
    [copy[0], copy[j]] = [copy[j], copy[0]];
  }
  return copy;
}

function targetGain(): number {
  if (muted) return 0;
  if (ducked) return MUSIC_LEVEL * 0.5;
  return MUSIC_LEVEL;
}

function ensureMusicGain(context: AudioContext): GainNode {
  if (!musicGain) {
    musicGain = context.createGain();
    musicGain.gain.value = targetGain();
    musicGain.connect(context.destination);
  }
  return musicGain;
}

function applyGain(seconds: number) {
  const context = getAudioContext();
  if (!context || !musicGain) return;
  const now = context.currentTime;
  const next = targetGain();
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(next, now + seconds);
}

function stopSource() {
  if (!currentSource) return;
  currentSource.onended = null;
  try {
    currentSource.stop();
  } catch {
    /* already stopped */
  }
  currentSource.disconnect();
  currentSource = null;
}

function takeNext(avoid: string | null): string {
  if (upcoming.length === 0) upcoming = shuffledPlaylist(GAMEPLAY_TRACKS, avoid);
  let name = upcoming.shift() ?? GAMEPLAY_TRACKS[0];
  if (name === avoid && upcoming.length > 0) {
    upcoming.push(name);
    name = upcoming.shift() ?? name;
  }
  return name;
}

function startBuffer(name: string, loop: boolean) {
  const context = getAudioContext();
  const buffer = buffers.get(name);
  if (!context || !buffer) return;
  const gain = ensureMusicGain(context);
  stopSource();
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(gain);
  source.onended = () => {
    if (currentSource !== source) return;
    currentSource = null;
    if (mode !== 'gameplay' || ducked) return;
    startBuffer(takeNext(name), false);
  };
  currentSource = source;
  currentTrack = name;
  source.start();
}

async function readBody(response: Response, onBytes: (count: number) => void): Promise<ArrayBuffer> {
  const reader = response.body?.getReader();
  if (!reader) {
    const body = await response.arrayBuffer();
    onBytes(body.byteLength);
    return body;
  }
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    size += value.byteLength;
    onBytes(value.byteLength);
  }
  const copy = new ArrayBuffer(size);
  const view = new Uint8Array(copy);
  let offset = 0;
  for (const part of parts) {
    view.set(part, offset);
    offset += part.byteLength;
  }
  return copy;
}

/** Fetch and decode every track. `onProgress` receives 0–1 from bytes received. */
export async function preloadMusic(onProgress: (ratio: number) => void): Promise<void> {
  onProgress(0);
  const opened = await Promise.all(ALL_TRACKS.map(async (name) => {
    const response = await fetch(trackUrl(name));
    if (!response.ok) throw new Error(`Could not load ${name}`);
    const total = Number(response.headers.get('content-length')) || 0;
    return { name, response, total };
  }));
  const expected = opened.reduce((sum, item) => sum + item.total, 0);
  let received = 0;
  const report = (count: number) => {
    received += count;
    if (expected > 0) onProgress(Math.min(0.99, received / expected));
  };
  const context = getAudioContext();
  let finished = 0;
  await Promise.all(opened.map(async ({ name, response, total }) => {
    try {
      const bytes = await readBody(response, report);
      if (!total) {
        finished += 1;
        onProgress(Math.min(0.99, finished / ALL_TRACKS.length));
      }
      if (!context) return;
      const audio = await context.decodeAudioData(bytes.slice(0));
      buffers.set(name, audio);
    } catch (error) {
      console.warn(`Tidy Up: skipped ${name}`, error);
    }
  }));
  onProgress(1);
}

export function setMusicMuted(next: boolean) {
  muted = next;
  applyGain(0.08);
}

/** Loop the menu theme. No-ops while that loop is already running. */
export function ensureMenuTheme() {
  ducked = false;
  if (mode === 'theme' && currentSource) {
    applyGain(0.2);
    return;
  }
  mode = 'theme';
  upcoming = [];
  applyGain(0.12);
  startBuffer(THEME_TRACK, true);
}

/** Start a shuffled gameplay track. Replaces the menu theme. */
export function startGameplay() {
  mode = 'gameplay';
  ducked = false;
  upcoming = [];
  applyGain(0.12);
  startBuffer(takeNext(currentTrack), false);
}

/** Drop the bed to half volume and hold it until the next round. */
export function duckMusic() {
  if (mode !== 'gameplay') return;
  ducked = true;
  applyGain(0.45);
}

/** Full volume again, on a different gameplay track. */
export function beginNextRoundMusic() {
  const previous = currentTrack;
  mode = 'gameplay';
  ducked = false;
  stopSource();
  applyGain(0.12);
  startBuffer(takeNext(previous), false);
}
