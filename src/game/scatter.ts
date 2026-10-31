import { hashString, mulberry32 } from './rng';

export type Spot = {
  x: number;
  y: number;
  rot: number;
};

const MARGIN = 0.06;
const ATTEMPTS = 36;

/**
 * Deals `count` cluttered positions inside a floor of the given aspect ratio
 * (width / height). Positions are percentages of the floor. The same key and
 * aspect always deal the same clutter.
 */
export function scatterSpots(key: string, count: number, aspect = 1.4): Spot[] {
  if (count <= 0) return [];
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1.4;
  const rng = mulberry32(hashString(`floor:${key}:${safeAspect.toFixed(2)}`));
  const width = safeAspect;
  const height = 1;
  const minDistance = 0.82 * Math.sqrt((width * height) / count);
  const placed: Array<{ x: number; y: number }> = [];
  const spots: Spot[] = [];

  for (let index = 0; index < count; index += 1) {
    let best = { x: width / 2, y: height / 2 };
    let bestGap = -1;
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      const candidate = {
        x: MARGIN * width + rng.next() * width * (1 - MARGIN * 2),
        y: MARGIN * height + rng.next() * height * (1 - MARGIN * 2),
      };
      let gap = Infinity;
      for (const other of placed) {
        gap = Math.min(gap, Math.hypot(candidate.x - other.x, candidate.y - other.y));
      }
      if (gap > bestGap) {
        best = candidate;
        bestGap = gap;
      }
      if (gap >= minDistance) break;
    }
    placed.push(best);
    spots.push({
      x: (best.x / width) * 100,
      y: (best.y / height) * 100,
      rot: Math.round(rng.next() * 90 - 45),
    });
  }
  return spots;
}

export function minSpacing(spots: Spot[], aspect: number): number {
  let closest = Infinity;
  for (let i = 0; i < spots.length; i += 1) {
    for (let j = i + 1; j < spots.length; j += 1) {
      const dx = ((spots[i].x - spots[j].x) / 100) * aspect;
      const dy = (spots[i].y - spots[j].y) / 100;
      closest = Math.min(closest, Math.hypot(dx, dy));
    }
  }
  return closest;
}
