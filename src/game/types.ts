export type TargetType = 'slot' | 'bin';

export type ThemeId = 'workshop' | 'study' | 'kitchen' | 'garden' | 'bath' | 'sewing';

export type Mode = 'campaign' | 'silhouette' | 'peek' | 'mixed' | 'perfect' | 'endless';

export type Target = {
  key: string;
  label: string;
  kind: string;
  type: TargetType;
};

export type Drawer = {
  tab: string;
  name: string;
  description: string;
  targets: Target[];
};

export type Piece = {
  id: string;
  kind: string;
  label: string;
  target: string;
  drawer: number;
};

export type Clutter = {
  id: string;
  kind: string;
  label: string;
};

export type Level = {
  index: number;
  name: string;
  short: string;
  subtitle: string;
  bench: string;
  organizer: string;
  organizerDetail: string;
  empty: string;
  win: string;
  themeId: ThemeId;
  accent: string;
  accentDeep: string;
  drawers: Drawer[];
  items: Piece[];
  clutter: Clutter[];
};

export type KindDef = {
  kind: string;
  label: string;
  binLabel?: string;
};

export type Group = {
  name: string;
  description: string;
  slots?: KindDef[];
  bins?: KindDef[];
};

export type Theme = {
  id: ThemeId;
  name: string;
  short: string;
  bench: string;
  organizer: string;
  organizerDetail: string;
  empty: string;
  win: string;
  accent: string;
  accentDeep: string;
  groups: Group[];
  clutter: KindDef[];
};

export type SaveData = {
  v: 2;
  mode: Mode;
  seed: string;
  level: number;
  done: string[];
  mistakes: number;
  hintsUsed: number;
  muted: boolean;
  elapsed: number;
};

export type PlaceResult = 'missing' | 'wrong' | 'placed';

export type SaveStatus = 'saved' | 'unavailable' | 'empty';
