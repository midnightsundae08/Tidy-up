import type { Level, Piece, PlaceResult, Target, TargetType } from './types';

export function pieceById(level: Level, id: string): Piece | undefined {
  return level.items.find((item) => item.id === id);
}

export function targetFor(level: Level, item: Piece): Target | undefined {
  return level.drawers[item.drawer]?.targets.find((target) => target.key === item.target);
}

export function evaluatePlace(
  level: Level,
  done: ReadonlySet<string>,
  itemId: string,
  drawerIndex: number,
  key: string,
  type: TargetType,
): PlaceResult {
  const item = pieceById(level, itemId);
  if (!item || done.has(itemId)) return 'missing';
  const target = targetFor(level, item);
  if (!target || item.drawer !== drawerIndex || key !== item.target || target.type !== type) {
    return 'wrong';
  }
  return 'placed';
}

export function peekRemaining(hintsUsed: number): number {
  return Math.max(0, 1 - hintsUsed);
}

export function nextHintPiece(level: Level, done: ReadonlySet<string>, selectedId: string | null): Piece | undefined {
  if (selectedId) {
    const selected = pieceById(level, selectedId);
    if (selected && !done.has(selected.id)) return selected;
  }
  return level.items.find((item) => !done.has(item.id));
}

export function pieceNumber(id: string): number {
  const match = /-(\d+)$/.exec(id);
  return match ? Number(match[1]) : 0;
}

export function timeBudget(index: number, pieceCount: number): number {
  const perPiece = Math.max(3.5, 9 - index * 0.55);
  return Math.round(pieceCount * perPiece + 15);
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function tidyStars(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export const TILTS = [-5, 3, -2, 5, -3, 4, -4, 2, -5, 4, -3, 3, 1, -4, 5, 2, -3, 4];

export function tiltFor(index: number): number {
  return TILTS[index % TILTS.length];
}
