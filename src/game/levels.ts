import { campaignLevel } from './generate';
import { handmade } from './handmade';
import { generateLevel } from './generate';
import type { Level, Mode } from './types';

export function getLevel(mode: Mode, seed: string, index: number): Level {
  if (mode === 'campaign' && index === 0) return handmade[0];
  if (mode === 'campaign' && index === 1) return handmade[1];
  if (mode === 'campaign') return campaignLevel(index);
  return { ...generateLevel(seed, index + 4, mode), index };
}
