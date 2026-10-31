import type { Level } from './types';
import { themes } from './catalog';

function slot(key: string, label: string) {
  return { key, label, kind: key, type: 'slot' as const };
}

function bin(key: string, label: string) {
  return { key, label, kind: key, type: 'bin' as const };
}

function one(key: string, label: string, drawer: number) {
  return { id: key, kind: key, label, target: key, drawer };
}

function many(key: string, label: string, drawer: number, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${key}-${index + 1}`,
    kind: key,
    label,
    target: key,
    drawer,
  }));
}

const workshop = themes.workshop;
const study = themes.study;

export const handmade: Level[] = [
  {
    index: 0,
    name: workshop.name,
    short: workshop.short,
    subtitle: 'Someone knocked over the toolbox! Let’s put it right.',
    bench: workshop.bench,
    organizer: workshop.organizer,
    organizerDetail: workshop.organizerDetail,
    empty: workshop.empty,
    win: workshop.win,
    themeId: 'workshop',
    accent: workshop.accent,
    accentDeep: workshop.accentDeep,
    drawers: [
      {
        tab: 'Top drawer',
        name: 'The hand tools',
        description: 'Match the tools to their foam cutouts.',
        targets: [slot('hammer', 'Hammer'), slot('wrench', 'Wrench'), slot('screwdriver', 'Screwdriver')],
      },
      {
        tab: 'Middle drawer',
        name: 'The extras',
        description: 'A snug little spot for each tool.',
        targets: [slot('pliers', 'Pliers'), slot('tape', 'Tape measure'), slot('flashlight', 'Flashlight')],
      },
      {
        tab: 'Bottom drawer',
        name: 'The little bits',
        description: 'Separate the nuts, bolts and screws into their bins.',
        targets: [bin('nut', 'Nuts'), bin('bolt', 'Bolts'), bin('screw', 'Screws')],
      },
    ],
    items: [
      one('hammer', 'Hammer', 0),
      one('wrench', 'Wrench', 0),
      one('screwdriver', 'Screwdriver', 0),
      one('pliers', 'Pliers', 1),
      one('tape', 'Tape measure', 1),
      one('flashlight', 'Flashlight', 1),
      ...many('nut', 'Nut', 2, 3),
      ...many('bolt', 'Bolt', 2, 3),
      ...many('screw', 'Screw', 2, 3),
    ],
    clutter: [
      { id: 'clutter-rag-1', kind: 'rag', label: 'Shop rag' },
      { id: 'clutter-scrap-2', kind: 'scrap', label: 'Wood offcut' },
    ],
  },
  {
    index: 1,
    name: study.name,
    short: study.short,
    subtitle: 'The desk got a little chaotic. Everything needs a home.',
    bench: study.bench,
    organizer: study.organizer,
    organizerDetail: study.organizerDetail,
    empty: study.empty,
    win: study.win,
    themeId: 'study',
    accent: study.accent,
    accentDeep: study.accentDeep,
    drawers: [
      {
        tab: 'Top drawer',
        name: 'Writing things',
        description: 'Every useful tool has its own home.',
        targets: [slot('notebook', 'Notebook'), slot('pen', 'Pen'), slot('ruler', 'Ruler')],
      },
      {
        tab: 'Middle drawer',
        name: 'Handy helpers',
        description: 'Match these study supplies to their cutouts.',
        targets: [slot('scissors', 'Scissors'), slot('stapler', 'Stapler'), slot('sticky', 'Sticky notes')],
      },
      {
        tab: 'Bottom drawer',
        name: 'Tiny supplies',
        description: 'Sort the little stationery bits into their bins.',
        targets: [bin('clip', 'Paper clips'), bin('eraser', 'Erasers'), bin('pushpin', 'Pushpins')],
      },
    ],
    items: [
      one('notebook', 'Notebook', 0),
      one('pen', 'Pen', 0),
      one('ruler', 'Ruler', 0),
      one('scissors', 'Scissors', 1),
      one('stapler', 'Stapler', 1),
      one('sticky', 'Sticky notes', 1),
      ...many('clip', 'Paper clip', 2, 2),
      ...many('eraser', 'Eraser', 2, 2),
      ...many('pushpin', 'Pushpin', 2, 2),
    ],
    clutter: [
      { id: 'clutter-receipt-1', kind: 'receipt', label: 'Old receipt' },
      { id: 'clutter-crumbs-2', kind: 'crumbs', label: 'Cookie crumbs' },
      { id: 'clutter-bottlecap-3', kind: 'bottlecap', label: 'Bottle cap' },
    ],
  },
];
