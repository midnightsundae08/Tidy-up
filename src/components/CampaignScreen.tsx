import { CAMPAIGN_SEED } from '../game/generate';
import { getLevel } from '../game/levels';
import type { SaveData } from '../game/types';

export function CampaignScreen({
  save,
  onPlay,
  onBack,
}: {
  save: SaveData | null;
  onPlay: (index: number) => void;
  onBack: () => void;
}) {
  const extra = save?.mode === 'campaign' && save.level > 7 ? [save.level] : [];
  const indexes = [...Array.from({ length: 8 }, (_, index) => index), ...extra];
  return (
    <section className="screen campaign" aria-label="Campaign">
      <div className="screen-head">
        <div className="eyebrow">The campaign</div>
        <h1>One theme at a time.</h1>
        <p>The toolbox and the desk come first. After that, the drawers deal themselves, and the path keeps going.</p>
      </div>
      <div className="card-grid">
        {indexes.map((index) => {
          const level = getLevel('campaign', CAMPAIGN_SEED, index);
          const current = save?.mode === 'campaign' && save.level === index;
          const cleared = save?.mode === 'campaign' && save.level > index;
          const progress = current ? `${save.done.length} / ${level.items.length}` : cleared ? 'Tidy' : 'Ready';
          return (
            <button key={index} type="button" className={`level-card${current ? ' is-current' : ''}`} onClick={() => onPlay(index)}>
              <span className="level-card-index">{String(index + 1).padStart(2, '0')}</span>
              <strong>{level.name}</strong>
              <small>{level.short}</small>
              <em>{current && save.done.length > 0 && save.done.length < level.items.length ? `In progress · ${progress}` : progress}</em>
            </button>
          );
        })}
      </div>
      <button type="button" className="text-button back-link" onClick={onBack}>Back home</button>
    </section>
  );
}
