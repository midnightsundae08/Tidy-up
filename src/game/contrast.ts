export const ink = {
  body: '#2f5346',
  strong: '#1c3d32',
  cream: '#fffdf8',
  page: '#edf4ed',
  mint: '#d3e5ca',
  guidance: '#f0f7ee',
  pill: '#f6ecdf',
  button: '#247357',
  kitchen: '#b85a42',
  garden: '#2f7d45',
  bath: '#2a7580',
  sewing: '#a24b64',
  filled: '#e5f5d9',
  filledBg: '#50755b',
} as const;

export function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export const contrastPairs: Array<[string, string]> = [
  [ink.body, ink.page],
  [ink.body, ink.cream],
  [ink.body, ink.guidance],
  [ink.strong, ink.mint],
  [ink.strong, ink.cream],
  [ink.strong, ink.pill],
  ['#ffffff', ink.button],
  ['#ffffff', ink.kitchen],
  ['#ffffff', ink.garden],
  ['#ffffff', ink.bath],
  ['#ffffff', ink.sewing],
  [ink.filled, ink.filledBg],
];
