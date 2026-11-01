import { CAMPAIGN_SEED } from './generate';
import { handmade } from './handmade';
import { getLevel } from './levels';
import type { Mode, SaveData } from './types';

export type KeyValueStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const SAVE_V2 = 'everything-in-its-place-save-v2';
const SAVE_V1 = 'everything-in-its-place-save-v1';

const MODES: Mode[] = ['campaign', 'silhouette', 'peek', 'mixed', 'perfect', 'endless'];

export function emptySave(muted = false): SaveData {
  return {
    v: 2,
    mode: 'campaign',
    seed: CAMPAIGN_SEED,
    level: 0,
    done: [],
    mistakes: 0,
    hintsUsed: 0,
    muted,
    elapsed: 0,
  };
}

export function migrateV1(data: unknown): SaveData | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as { v?: unknown; level?: unknown; done?: unknown; muted?: unknown };
  if (raw.v !== 1 || typeof raw.level !== 'number' || !Number.isInteger(raw.level)) return null;
  if (raw.level < 0 || raw.level > 1) return null;
  const level = handmade[raw.level];
  const valid = new Set(level.items.map((item) => item.id));
  const done = Array.isArray(raw.done)
    ? raw.done.filter((id): id is string => typeof id === 'string' && valid.has(id))
    : [];
  return {
    v: 2,
    mode: 'campaign',
    seed: CAMPAIGN_SEED,
    level: raw.level,
    done,
    mistakes: 0,
    hintsUsed: 0,
    muted: Boolean(raw.muted),
    elapsed: 0,
  };
}

function sanitize(data: unknown): SaveData | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Partial<SaveData>;
  if (raw.v !== 2 || typeof raw.mode !== 'string' || !MODES.includes(raw.mode)) return null;
  if (typeof raw.seed !== 'string' || raw.seed.length === 0 || raw.seed.length > 80) return null;
  const levelCap = raw.mode === 'endless' ? 100000 : 200;
  if (typeof raw.level !== 'number' || !Number.isInteger(raw.level) || raw.level < 0 || raw.level > levelCap) return null;
  const level = getLevel(raw.mode, raw.seed, raw.level);
  const valid = new Set(level.items.map((item) => item.id));
  const done = Array.isArray(raw.done)
    ? raw.done.filter((id): id is string => typeof id === 'string' && valid.has(id))
    : [];
  return {
    v: 2,
    mode: raw.mode,
    seed: raw.seed,
    level: raw.level,
    done,
    mistakes: typeof raw.mistakes === 'number' && raw.mistakes >= 0 ? Math.floor(raw.mistakes) : 0,
    hintsUsed: typeof raw.hintsUsed === 'number' && raw.hintsUsed >= 0 ? Math.floor(raw.hintsUsed) : 0,
    muted: Boolean(raw.muted),
    elapsed: typeof raw.elapsed === 'number' && raw.elapsed >= 0 && raw.elapsed < 100000 ? Math.floor(raw.elapsed) : 0,
  };
}

export function readSave(store: KeyValueStore): { save: SaveData | null; status: 'saved' | 'empty' } {
  const current = store.getItem(SAVE_V2);
  if (current) {
    try {
      const parsed = sanitize(JSON.parse(current) as unknown);
      if (parsed) return { save: parsed, status: 'saved' };
    } catch {
      return { save: null, status: 'empty' };
    }
  }
  const legacy = store.getItem(SAVE_V1);
  if (!legacy) return { save: null, status: 'empty' };
  try {
    const migrated = migrateV1(JSON.parse(legacy) as unknown);
    return migrated ? { save: migrated, status: 'saved' } : { save: null, status: 'empty' };
  } catch {
    return { save: null, status: 'empty' };
  }
}

export function writeSave(store: KeyValueStore, save: SaveData): 'saved' | 'unavailable' {
  try {
    store.setItem(SAVE_V2, JSON.stringify(save));
    return 'saved';
  } catch {
    return 'unavailable';
  }
}

export function browserStore(): KeyValueStore {
  return window.localStorage;
}
