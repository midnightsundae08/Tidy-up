import { describe, expect, it } from 'vitest';
import { shuffledPlaylist } from './music';

describe('gameplay playlist', () => {
  const tracks = ['extended', 'lofi', 'slow'];

  it('keeps every track and does not open with the one to avoid', () => {
    const playlist = shuffledPlaylist(tracks, 'extended', () => 0);
    expect(playlist).toHaveLength(3);
    expect(new Set(playlist)).toEqual(new Set(tracks));
    expect(playlist[0]).not.toBe('extended');
  });

  it('leaves the order alone when nothing needs avoiding', () => {
    const playlist = shuffledPlaylist(tracks, null, () => 0);
    expect(new Set(playlist)).toEqual(new Set(tracks));
  });
});
