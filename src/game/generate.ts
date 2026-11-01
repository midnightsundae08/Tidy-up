import { campaignThemes, challengeThemes, themes } from './catalog';
import { hashString, mulberry32, shuffle, type Rng } from './rng';
import type { Clutter, Drawer, Group, KindDef, Level, Mode, Piece, Target, Theme, ThemeId } from './types';

export const CAMPAIGN_SEED = 'campaign';
export const THEMED_RUN = 10;

export type Difficulty = {
  drawers: number;
  useBins: boolean;
  binSize: number;
};

export function difficultyFor(index: number): Difficulty {
  const step = Math.max(0, index - 2);
  return {
    drawers: Math.min(4, 2 + Math.floor(step / 2)),
    useBins: step >= 2,
    binSize: step < 4 ? 2 : step < 7 ? 3 : 4,
  };
}

export function challengeDifficulty(mode: Mode): Difficulty {
  if (mode === 'perfect') return { drawers: 3, useBins: true, binSize: 2 };
  return { drawers: 3, useBins: true, binSize: 3 };
}

function tabName(index: number, total: number): string {
  if (total === 2) return index === 0 ? 'Top drawer' : 'Bottom drawer';
  if (index === 0) return 'Top drawer';
  if (index === total - 1) return 'Bottom drawer';
  if (total === 3) return 'Middle drawer';
  return index === 1 ? 'Second drawer' : 'Third drawer';
}

function slotGroups(theme: Theme): Group[] {
  return theme.groups.filter((group) => group.slots && group.slots.length > 0);
}

function binKinds(theme: Theme): KindDef[] {
  return theme.groups.find((group) => group.bins && group.bins.length > 0)?.bins ?? [];
}

function makeSlotDrawer(group: Group, index: number, total: number, rng: Rng): { drawer: Drawer; items: Piece[] } {
  const slots = shuffle(group.slots ?? [], rng);
  const targets: Target[] = slots.map((item) => ({
    key: item.kind,
    label: item.label,
    kind: item.kind,
    type: 'slot',
  }));
  const items: Piece[] = slots.map((item) => ({
    id: item.kind,
    kind: item.kind,
    label: item.label,
    target: item.kind,
    drawer: index,
  }));
  return {
    drawer: {
      tab: tabName(index, total),
      name: group.name,
      description: group.description,
      targets,
    },
    items,
  };
}

function makeBinDrawer(kinds: KindDef[], index: number, total: number, binSize: number, rng: Rng): { drawer: Drawer; items: Piece[] } {
  const chosen = shuffle(kinds, rng).slice(0, 3);
  const targets: Target[] = chosen.map((item) => ({
    key: item.kind,
    label: item.binLabel ?? item.label,
    kind: item.kind,
    type: 'bin',
  }));
  const items: Piece[] = chosen.flatMap((item) =>
    Array.from({ length: binSize }, (_, piece) => ({
      id: `${item.kind}-${piece + 1}`,
      kind: item.kind,
      label: item.label,
      target: item.kind,
      drawer: index,
    })),
  );
  return {
    drawer: {
      tab: tabName(index, total),
      name: 'The little bits',
      description: 'Sort the small pieces into their bins.',
      targets,
    },
    items,
  };
}

function themeById(id: ThemeId): Theme {
  return themes[id];
}

export function clutterCount(index: number, mode: Mode): number {
  if (mode === 'campaign' || mode === 'endless') return Math.min(4, 1 + Math.floor(index / 2));
  return 2 + Math.min(2, index);
}

export function dealClutter(picked: Theme[], count: number, rng: Rng): Clutter[] {
  const pool = picked.flatMap((theme) => theme.clutter);
  const seen = new Set<string>();
  const unique = pool.filter((kind) => (seen.has(kind.kind) ? false : (seen.add(kind.kind), true)));
  return shuffle(unique, rng).slice(0, Math.min(count, unique.length)).map((kind, position) => ({
    id: `clutter-${kind.kind}-${position + 1}`,
    kind: kind.kind,
    label: kind.label,
  }));
}

export function generateLevel(seed: string, index: number, mode: Mode): Level {
  const rng = mulberry32(hashString(`${seed}:${mode}:${index}`));
  const difficulty = mode === 'campaign' || mode === 'endless' ? difficultyFor(index) : challengeDifficulty(mode);
  const picked = pickThemes(mode, index, rng);
  const primary = picked[0];
  const slotCount = difficulty.useBins ? difficulty.drawers - 1 : difficulty.drawers;
  const groups: Group[] = [];

  if (mode === 'mixed' && picked.length === 2) {
    const first = shuffle(slotGroups(picked[0]), rng)[0];
    const second = shuffle(slotGroups(picked[1]), rng)[0];
    if (first) groups.push(first);
    if (second) groups.push(second);
  } else {
    groups.push(...shuffle(slotGroups(primary), rng).slice(0, slotCount));
  }

  const total = groups.length + (difficulty.useBins ? 1 : 0);
  const drawers: Drawer[] = [];
  const items: Piece[] = [];
  groups.forEach((group, drawerIndex) => {
    const built = makeSlotDrawer(group, drawerIndex, total, rng);
    drawers.push(built.drawer);
    items.push(...built.items);
  });

  if (difficulty.useBins) {
    const kinds = picked.flatMap((theme) => binKinds(theme));
    const source = picked.length === 1 ? picked[0].groups.find((group) => group.bins?.length) : undefined;
    const built = makeBinDrawer(kinds, drawers.length, total, difficulty.binSize, rng);
    if (source) {
      built.drawer.name = source.name;
      built.drawer.description = source.description;
    }
    drawers.push(built.drawer);
    items.push(...built.items);
  }

  drawers.forEach((drawer, drawerIndex) => {
    drawer.tab = tabName(drawerIndex, drawers.length);
  });

  const mixed = mode === 'mixed' && picked.length === 2;
  return {
    index,
    name: mixed ? `${picked[0].name} & ${picked[1].name}` : primary.name,
    short: mixed ? 'MIXED CABINET' : primary.short,
    subtitle: mixed
      ? 'Two themes tumbled together. Sort them into one cabinet.'
      : `${primary.name} needs a little tidy. Take your time.`,
    bench: primary.bench,
    organizer: mixed ? 'The shared cabinet' : primary.organizer,
    organizerDetail: mixed ? 'Each drawer leans toward one theme. The bins hold both.' : primary.organizerDetail,
    empty: primary.empty,
    win: mixed ? 'Two themes, one tidy cabinet. Beautifully sorted.' : primary.win,
    themeId: primary.id,
    accent: primary.accent,
    accentDeep: primary.accentDeep,
    drawers,
    items: shuffle(items, rng),
    clutter: dealClutter(picked, clutterCount(index, mode), rng),
  };
}

function pickThemes(mode: Mode, index: number, rng: Rng): Theme[] {
  if (mode === 'campaign') {
    const span = campaignThemes.length;
    const offset = (((index - 2) % span) + span) % span;
    return [themeById(campaignThemes[offset])];
  }
  if (mode === 'endless') {
    const id = challengeThemes[(index + rng.int(challengeThemes.length)) % challengeThemes.length];
    return [themeById(id)];
  }
  if (mode === 'mixed') {
    const pool = shuffle(challengeThemes, rng);
    return [themeById(pool[0]), themeById(pool[1])];
  }
  const id = challengeThemes[rng.int(challengeThemes.length)];
  return [themeById(id)];
}

export function campaignLevel(index: number): Level {
  return generateLevel(CAMPAIGN_SEED, index, 'campaign');
}
