import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SVG } from './art';
import { themes } from './catalog';
import { contrast, contrastPairs } from './contrast';
import { CAMPAIGN_SEED, generateLevel } from './generate';
import { handmade } from './handmade';
import { getLevel } from './levels';
import { evaluatePlace, formatClock, peekRemaining, tidyStars, timeBudget } from './rules';
import { minSpacing, scatterSpots } from './scatter';
import { migrateV1, readSave, writeSave, type KeyValueStore } from './storage';

function memory(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('placement', () => {
  const level = handmade[0];

  it('accepts a tool in its own foam slot', () => {
    expect(evaluatePlace(level, new Set(), 'hammer', 0, 'hammer', 'slot')).toBe('placed');
  });

  it('rejects the right shape in the wrong drawer', () => {
    expect(evaluatePlace(level, new Set(), 'hammer', 1, 'hammer', 'slot')).toBe('wrong');
  });

  it('rejects a tool dropped on another cutout', () => {
    expect(evaluatePlace(level, new Set(), 'wrench', 0, 'screwdriver', 'slot')).toBe('wrong');
  });

  it('fills a bin one piece at a time and then stops', () => {
    const done = new Set<string>();
    expect(evaluatePlace(level, done, 'nut-1', 2, 'nut', 'bin')).toBe('placed');
    done.add('nut-1');
    expect(evaluatePlace(level, done, 'nut-2', 2, 'nut', 'bin')).toBe('placed');
    done.add('nut-2');
    expect(evaluatePlace(level, done, 'nut-1', 2, 'nut', 'bin')).toBe('missing');
    expect(evaluatePlace(level, done, 'bolt-1', 2, 'nut', 'bin')).toBe('wrong');
  });
});

describe('hints and stars', () => {
  it('gives one peek', () => {
    expect(peekRemaining(0)).toBe(1);
    expect(peekRemaining(1)).toBe(0);
  });

  it('turns mistakes into tidy stars', () => {
    expect(tidyStars(0)).toBe(3);
    expect(tidyStars(2)).toBe(2);
    expect(tidyStars(3)).toBe(1);
  });
});

describe('generation', () => {
  it('deals the same board for the same seed', () => {
    const first = generateLevel('seed-a', 5, 'campaign');
    const second = generateLevel('seed-a', 5, 'campaign');
    expect(first.items.map((item) => item.id)).toEqual(second.items.map((item) => item.id));
    expect(first.drawers.map((drawer) => drawer.name)).toEqual(second.drawers.map((drawer) => drawer.name));
  });

  it('changes the board when the level index changes', () => {
    const fourth = generateLevel(CAMPAIGN_SEED, 4, 'campaign');
    const fifth = generateLevel(CAMPAIGN_SEED, 5, 'campaign');
    expect(fourth.items.map((item) => item.id).join()).not.toBe(fifth.items.map((item) => item.id).join());
  });

  it('matches bin counts to the pieces that were dealt', () => {
    for (const index of [2, 4, 6, 9]) {
      const level = getLevel('campaign', CAMPAIGN_SEED, index);
      level.drawers.forEach((drawer, drawerIndex) => {
        drawer.targets.forEach((target) => {
          const count = level.items.filter((item) => item.drawer === drawerIndex && item.target === target.key).length;
          expect(count).toBeGreaterThan(0);
          if (target.type === 'slot') expect(count).toBe(1);
          if (target.type === 'bin') expect(count).toBeGreaterThan(1);
        });
      });
      expect(level.drawers.length).toBeGreaterThan(0);
      expect(level.drawers.length).toBeLessThanOrEqual(4);
    }
  });

  it('keeps the handmade levels intact', () => {
    expect(getLevel('campaign', CAMPAIGN_SEED, 0).items).toHaveLength(15);
    expect(getLevel('campaign', CAMPAIGN_SEED, 1).items).toHaveLength(12);
    expect(getLevel('campaign', CAMPAIGN_SEED, 0).name).toBe('The Toolbox');
  });

  it('has a drawing for every catalog kind', () => {
    const kinds = new Set<string>();
    for (const level of handmade) {
      for (const item of level.items) kinds.add(item.kind);
    }
    for (const theme of Object.values(themes)) {
      for (const group of theme.groups) {
        for (const item of [...(group.slots ?? []), ...(group.bins ?? [])]) kinds.add(item.kind);
      }
    }
    for (const kind of kinds) {
      expect(SVG[kind], kind).toBeTruthy();
    }
  });
});

describe('saves', () => {
  it('migrates a toolbox save and drops unknown ids', () => {
    const save = migrateV1({ v: 1, level: 0, done: ['hammer', '<script>'], muted: true });
    expect(save).toMatchObject({ mode: 'campaign', level: 0, done: ['hammer'], muted: true, hintsUsed: 0 });
  });

  it('ignores a legacy save from outside the handmade levels', () => {
    expect(migrateV1({ v: 1, level: 4, done: [], muted: false })).toBeNull();
  });

  it('round-trips a challenge save and reports a full store', () => {
    const store = memory();
    const save = {
      v: 2 as const,
      mode: 'peek' as const,
      seed: 'round-seed',
      level: 1,
      done: [] as string[],
      mistakes: 2,
      hintsUsed: 1,
      muted: false,
      elapsed: 42,
    };
    expect(writeSave(store, save)).toBe('saved');
    expect(readSave(store).save).toMatchObject({ mode: 'peek', hintsUsed: 1, level: 1, elapsed: 42 });
  });

  it('reads a v1 save when v2 is absent', () => {
    const store = memory({
      'everything-in-its-place-save-v1': JSON.stringify({ v: 1, level: 1, done: ['pen'], muted: false }),
    });
    expect(readSave(store).save).toMatchObject({ level: 1, done: ['pen'], mode: 'campaign' });
  });

  it('reports when the store refuses to write', () => {
    const store: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('private');
      },
    };
    expect(writeSave(store, migrateV1({ v: 1, level: 0, done: [], muted: false })!)).toBe('unavailable');
  });
});

describe('contrast', () => {
  it('keeps instructional pairs at 4.5:1 or better', () => {
    for (const [foreground, background] of contrastPairs) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('uses those inks in the stylesheet', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toContain('#2f5346');
    expect(css).toContain('#1c3d32');
  });
});

describe('scatter', () => {
  it('deals the same floor for the same key', () => {
    expect(scatterSpots('toolbox:15', 17, 1.5)).toEqual(scatterSpots('toolbox:15', 17, 1.5));
  });

  it('changes the floor when the key changes', () => {
    const first = scatterSpots('toolbox', 12).map((spot) => spot.x);
    const second = scatterSpots('kitchen', 12).map((spot) => spot.x);
    expect(first.join()).not.toBe(second.join());
  });

  it('keeps every piece inside the floor with room between them', () => {
    for (const aspect of [0.7, 1.4, 2.4]) {
      const spots = scatterSpots('floor', 18, aspect);
      for (const spot of spots) {
        expect(spot.x).toBeGreaterThanOrEqual(5);
        expect(spot.x).toBeLessThanOrEqual(95);
        expect(spot.y).toBeGreaterThanOrEqual(5);
        expect(spot.y).toBeLessThanOrEqual(95);
        expect(Math.abs(spot.rot)).toBeLessThanOrEqual(45);
      }
      expect(minSpacing(spots, aspect)).toBeGreaterThan(0.5 * Math.sqrt(aspect / 18));
    }
  });

  it('does not line pieces up in rows', () => {
    const spots = scatterSpots('floor', 12, 1.4);
    const ys = spots.map((spot) => Math.round(spot.y / 5));
    expect(new Set(ys).size).toBeGreaterThan(4);
  });
});

describe('clutter', () => {
  it('puts a few unsortable things on every floor', () => {
    expect(handmade[0].clutter.length).toBeGreaterThan(0);
    for (const index of [2, 5, 9]) {
      const level = getLevel('campaign', CAMPAIGN_SEED, index);
      expect(level.clutter.length).toBeGreaterThan(0);
      const itemIds = new Set(level.items.map((item) => item.id));
      for (const junk of level.clutter) {
        expect(itemIds.has(junk.id)).toBe(false);
        expect(SVG[junk.kind]).toBeDefined();
      }
    }
  });

  it('adds more clutter as the campaign goes on', () => {
    expect(getLevel('campaign', CAMPAIGN_SEED, 9).clutter.length).toBeGreaterThan(getLevel('campaign', CAMPAIGN_SEED, 2).clutter.length);
  });

  it('never lets clutter count as a placement', () => {
    const level = handmade[0];
    expect(evaluatePlace(level, new Set(), 'clutter-rag-1', 0, 'hammer', 'slot')).toBe('missing');
  });
});

describe('timer', () => {
  it('gives less time per piece as levels rise', () => {
    expect(timeBudget(0, 15)).toBeGreaterThan(timeBudget(6, 15));
    expect(timeBudget(6, 15)).toBeGreaterThan(timeBudget(12, 15));
    expect(timeBudget(40, 15)).toBe(timeBudget(60, 15));
  });

  it('formats the clock', () => {
    expect(formatClock(150)).toBe('2:30');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(-3)).toBe('0:00');
  });
});
