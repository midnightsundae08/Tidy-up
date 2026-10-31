import type { Mode, SaveData } from '../game/types';

const CHALLENGES: Array<{ mode: Mode; title: string; detail: string; badge: string }> = [
  { mode: 'silhouette', title: 'Silhouette', detail: 'The cutouts stay shadowed until the shape fits.', badge: 'shadow' },
  { mode: 'peek', title: 'One peek', detail: 'The whole round gives you a single hint.', badge: 'peek' },
  { mode: 'mixed', title: 'Mixed cabinet', detail: 'Two themes share one set of drawers.', badge: 'mixed' },
  { mode: 'perfect', title: 'Perfect fit', detail: 'Wrong drops bounce. Fewer mistakes earn more stars.', badge: 'stars' },
];

export function ChallengeScreen({
  save,
  onStart,
  onBack,
}: {
  save: SaveData | null;
  onStart: (mode: Mode) => void;
  onBack: () => void;
}) {
  return (
    <section className="screen challenges" aria-label="Challenges">
      <div className="screen-head">
        <div className="eyebrow">Challenges</div>
        <h1>Three short rounds.</h1>
        <p>Same cozy pace. A different kind of tidy. Each run is seeded, so a new seed deals a new board.</p>
      </div>
      <div className="card-grid challenge-grid">
        {CHALLENGES.map((challenge) => {
          const current = save?.mode === challenge.mode;
          return (
            <button key={challenge.mode} type="button" className="level-card challenge-card" onClick={() => onStart(challenge.mode)}>
              <span className={`badge badge-${challenge.badge}`} aria-hidden="true" />
              <strong>{challenge.title}</strong>
              <small>{challenge.detail}</small>
              <em>{current ? `Resume round ${save.level + 1} of 3` : 'Start a run'}</em>
            </button>
          );
        })}
      </div>
      <button type="button" className="text-button back-link" onClick={onBack}>Back home</button>
    </section>
  );
}
