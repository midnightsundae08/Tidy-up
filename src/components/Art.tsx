import type { CSSProperties } from 'react';
import { SVG } from '../game/art';

function markup(kind: string) {
  return SVG[kind] ?? SVG.nut;
}

/**
 * A tool drawing, or, when `shadow` is set, the recess that tool leaves in a foam insert:
 * the artwork becomes a mask over a shaded well with a lit lower rim.
 */
export function Art({ kind, shadow = false }: { kind: string; shadow?: boolean }) {
  if (shadow) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${markup(kind)}</svg>`;
    const style = { '--cutout': `url("data:image/svg+xml,${encodeURIComponent(svg)}")` } as CSSProperties;
    return <span className="art-svg art-cutout" style={style} aria-hidden="true" />;
  }
  return (
    <svg
      className="art-svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup(kind) }}
    />
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
