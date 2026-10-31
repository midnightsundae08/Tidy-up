import type { Theme, ThemeId } from './types';

const workshop: Theme = {
  id: 'workshop',
  name: 'The Toolbox',
  short: 'THE WORKSHOP',
  bench: 'The workbench',
  organizer: 'The toolbox',
  organizerDetail: 'Open a drawer and match each piece to its spot.',
  empty: 'Not a thing out of place.',
  win: 'The toolbox is tidy, and every little thing is exactly where it belongs.',
  accent: '#339772',
  accentDeep: '#23594d',
  clutter: [
    { kind: 'rag', label: 'Shop rag' },
    { kind: 'scrap', label: 'Wood offcut' },
    { kind: 'pencil', label: 'Carpenter pencil' },
    { kind: 'bottlecap', label: 'Bottle cap' },
  ],
  groups: [
    {
      name: 'The hand tools',
      description: 'Match the tools to their foam cutouts.',
      slots: [
        { kind: 'hammer', label: 'Hammer' },
        { kind: 'wrench', label: 'Wrench' },
        { kind: 'screwdriver', label: 'Screwdriver' },
      ],
    },
    {
      name: 'The extras',
      description: 'A snug little spot for each tool.',
      slots: [
        { kind: 'pliers', label: 'Pliers' },
        { kind: 'tape', label: 'Tape measure' },
        { kind: 'flashlight', label: 'Flashlight' },
      ],
    },
    {
      name: 'The little bits',
      description: 'Separate the nuts, bolts and screws into their bins.',
      bins: [
        { kind: 'nut', label: 'Nut', binLabel: 'Nuts' },
        { kind: 'bolt', label: 'Bolt', binLabel: 'Bolts' },
        { kind: 'screw', label: 'Screw', binLabel: 'Screws' },
      ],
    },
  ],
};

const study: Theme = {
  id: 'study',
  name: 'Desk Reset',
  short: 'THE STUDY NOOK',
  bench: 'The desktop',
  organizer: 'The desk organizer',
  organizerDetail: 'Open each compartment to tidy up the desk.',
  empty: 'A desk ready for big ideas.',
  win: 'The study nook is sparkling clean. You made room for some big ideas!',
  accent: '#3e836c',
  accentDeep: '#2a6150',
  clutter: [
    { kind: 'receipt', label: 'Old receipt' },
    { kind: 'crumbs', label: 'Cookie crumbs' },
    { kind: 'bottlecap', label: 'Bottle cap' },
    { kind: 'leaf', label: 'Dry leaf' },
  ],
  groups: [
    {
      name: 'Writing things',
      description: 'Every useful tool has its own home.',
      slots: [
        { kind: 'notebook', label: 'Notebook' },
        { kind: 'pen', label: 'Pen' },
        { kind: 'ruler', label: 'Ruler' },
      ],
    },
    {
      name: 'Handy helpers',
      description: 'Match these study supplies to their cutouts.',
      slots: [
        { kind: 'scissors', label: 'Scissors' },
        { kind: 'stapler', label: 'Stapler' },
        { kind: 'sticky', label: 'Sticky notes' },
      ],
    },
    {
      name: 'Tiny supplies',
      description: 'Sort the little stationery bits into their bins.',
      bins: [
        { kind: 'clip', label: 'Paper clip', binLabel: 'Paper clips' },
        { kind: 'eraser', label: 'Eraser', binLabel: 'Erasers' },
        { kind: 'pushpin', label: 'Pushpin', binLabel: 'Pushpins' },
      ],
    },
  ],
};

const kitchen: Theme = {
  id: 'kitchen',
  name: 'The Kitchen',
  short: 'THE KITCHEN',
  bench: 'The counter',
  organizer: 'The kitchen drawers',
  organizerDetail: 'Open a drawer and give each tool its spot.',
  empty: 'A counter clear enough to cook.',
  win: 'The kitchen is calm again. Every tool has a drawer to call home.',
  accent: '#e39a78',
  accentDeep: '#b85a42',
  clutter: [
    { kind: 'crumbs', label: 'Toast crumbs' },
    { kind: 'bottlecap', label: 'Bottle cap' },
    { kind: 'receipt', label: 'Grocery receipt' },
    { kind: 'rag', label: 'Dish rag' },
  ],
  groups: [
    {
      name: 'Stovetop tools',
      description: 'Match each tool to its foam cutout.',
      slots: [
        { kind: 'spatula', label: 'Spatula' },
        { kind: 'whisk', label: 'Whisk' },
        { kind: 'ladle', label: 'Ladle' },
      ],
    },
    {
      name: 'Baking day',
      description: 'A snug spot for the baking tools.',
      slots: [
        { kind: 'rolling', label: 'Rolling pin' },
        { kind: 'cutter', label: 'Cookie cutter' },
        { kind: 'mitt', label: 'Oven mitt' },
      ],
    },
    {
      name: 'A warm drink',
      description: 'Kettle, mug, and infuser, each in its place.',
      slots: [
        { kind: 'kettle', label: 'Kettle' },
        { kind: 'mug', label: 'Mug' },
        { kind: 'infuser', label: 'Tea infuser' },
      ],
    },
    {
      name: 'Table bits',
      description: 'Sort the little tableware into bins.',
      bins: [
        { kind: 'spoon', label: 'Spoon', binLabel: 'Spoons' },
        { kind: 'fork', label: 'Fork', binLabel: 'Forks' },
        { kind: 'coaster', label: 'Coaster', binLabel: 'Coasters' },
      ],
    },
  ],
};

const garden: Theme = {
  id: 'garden',
  name: 'The Garden',
  short: 'THE POTTING BENCH',
  bench: 'The potting bench',
  organizer: 'The garden caddy',
  organizerDetail: 'Open a compartment and settle each tool.',
  empty: 'A bench ready for planting.',
  win: 'The potting bench is tidy. The garden can wait a minute.',
  accent: '#7dba78',
  accentDeep: '#2f7d45',
  clutter: [
    { kind: 'leaf', label: 'Fallen leaf' },
    { kind: 'twig', label: 'Twig' },
    { kind: 'scrap', label: 'Wood offcut' },
    { kind: 'rag', label: 'Garden rag' },
  ],
  groups: [
    {
      name: 'Hand tools',
      description: 'Match each tool to its foam cutout.',
      slots: [
        { kind: 'trowel', label: 'Trowel' },
        { kind: 'pruners', label: 'Pruners' },
        { kind: 'rake', label: 'Hand rake' },
      ],
    },
    {
      name: 'Plant care',
      description: 'A home for watering, spraying, and gloves.',
      slots: [
        { kind: 'watering', label: 'Watering can' },
        { kind: 'spray', label: 'Spray bottle' },
        { kind: 'gloves', label: 'Gloves' },
      ],
    },
    {
      name: 'Starting seeds',
      description: 'Pot, packet, and marker, side by side.',
      slots: [
        { kind: 'pot', label: 'Flower pot' },
        { kind: 'packet', label: 'Seed packet' },
        { kind: 'marker', label: 'Plant marker' },
      ],
    },
    {
      name: 'Little finds',
      description: 'Sort the seeds, pebbles, and twine.',
      bins: [
        { kind: 'seed', label: 'Seed', binLabel: 'Seeds' },
        { kind: 'pebble', label: 'Pebble', binLabel: 'Pebbles' },
        { kind: 'twine', label: 'Twine', binLabel: 'Twine coils' },
      ],
    },
  ],
};

const bath: Theme = {
  id: 'bath',
  name: 'The Bath',
  short: 'THE WASHROOM',
  bench: 'The sink',
  organizer: 'The bath cabinet',
  organizerDetail: 'Open a shelf and match each piece.',
  empty: 'A sink with room to spare.',
  win: 'The bath cabinet is peaceful. Everything is washed and put away.',
  accent: '#7ebec6',
  accentDeep: '#2a7580',
  clutter: [
    { kind: 'rag', label: 'Washcloth' },
    { kind: 'bottlecap', label: 'Bottle cap' },
    { kind: 'receipt', label: 'Pharmacy receipt' },
    { kind: 'leaf', label: 'Dry leaf' },
  ],
  groups: [
    {
      name: 'Wash up',
      description: 'Match the wash things to their cutouts.',
      slots: [
        { kind: 'soap', label: 'Soap' },
        { kind: 'sponge', label: 'Sponge' },
        { kind: 'brush', label: 'Brush' },
      ],
    },
    {
      name: 'Getting ready',
      description: 'Comb, mirror, and bottle, each in a spot.',
      slots: [
        { kind: 'comb', label: 'Comb' },
        { kind: 'mirror', label: 'Mirror' },
        { kind: 'bottle', label: 'Bottle' },
      ],
    },
    {
      name: 'Soft things',
      description: 'A place for the towel, loofah, and cap.',
      slots: [
        { kind: 'towel', label: 'Towel' },
        { kind: 'loofah', label: 'Loofah' },
        { kind: 'cap', label: 'Shower cap' },
      ],
    },
    {
      name: 'Tiny toiletries',
      description: 'Sort the little bits into their bins.',
      bins: [
        { kind: 'cotton', label: 'Cotton round', binLabel: 'Cotton rounds' },
        { kind: 'bobby', label: 'Bobby pin', binLabel: 'Bobby pins' },
        { kind: 'band', label: 'Hair band', binLabel: 'Hair bands' },
      ],
    },
  ],
};

const sewing: Theme = {
  id: 'sewing',
  name: 'The Sewing Box',
  short: 'THE SEWING TABLE',
  bench: 'The sewing table',
  organizer: 'The sewing box',
  organizerDetail: 'Open a tray and match each notion.',
  empty: 'A table ready for the next stitch.',
  win: 'The sewing box is in order. Every notion has a tray.',
  accent: '#e7a3b5',
  accentDeep: '#a24b64',
  clutter: [
    { kind: 'rag', label: 'Fabric scrap' },
    { kind: 'receipt', label: 'Pattern receipt' },
    { kind: 'pencil', label: 'Marking pencil' },
    { kind: 'bottlecap', label: 'Bottle cap' },
  ],
  groups: [
    {
      name: 'Cutting',
      description: 'Match the cutting tools to their cutouts.',
      slots: [
        { kind: 'shears', label: 'Shears' },
        { kind: 'rotary', label: 'Rotary cutter' },
        { kind: 'ripper', label: 'Seam ripper' },
      ],
    },
    {
      name: 'Stitching',
      description: 'Needle book, thread, and thimble.',
      slots: [
        { kind: 'needlebook', label: 'Needle book' },
        { kind: 'thread', label: 'Thread' },
        { kind: 'thimble', label: 'Thimble' },
      ],
    },
    {
      name: 'Marking',
      description: 'Tape, cushion, and chalk, side by side.',
      slots: [
        { kind: 'measure', label: 'Measuring tape' },
        { kind: 'cushion', label: 'Pin cushion' },
        { kind: 'chalk', label: 'Tailor chalk' },
      ],
    },
    {
      name: 'Notions',
      description: 'Sort the buttons, pins, and bobbins.',
      bins: [
        { kind: 'button', label: 'Button', binLabel: 'Buttons' },
        { kind: 'pin', label: 'Pin', binLabel: 'Pins' },
        { kind: 'bobbin', label: 'Bobbin', binLabel: 'Bobbins' },
      ],
    },
  ],
};

export const themes: Record<ThemeId, Theme> = {
  workshop,
  study,
  kitchen,
  garden,
  bath,
  sewing,
};

export const campaignThemes: ThemeId[] = ['kitchen', 'garden', 'bath', 'sewing'];

export const challengeThemes: ThemeId[] = ['workshop', 'study', 'kitchen', 'garden', 'bath', 'sewing'];
