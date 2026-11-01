import { useEffect, useState } from 'react';
import { preloadMusic } from '../game/music';

export function TitleScreen({ onBegin }: { onBegin: () => void }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    preloadMusic((ratio) => {
      if (active) setProgress(ratio);
    }).then(() => {
      if (active) setReady(true);
    }).catch((error: unknown) => {
      console.warn('Tidy Up: music preload failed', error);
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const percent = Math.round(progress * 100);

  return (
    <section className="screen title-screen" aria-label="Tidy Up">
      <svg className="title-broom" viewBox="0 0 120 200" aria-hidden="true" focusable="false">
        <path d="M48 6v124" stroke="#a9763f" strokeWidth="9" strokeLinecap="round" />
        <path d="M46 8v120" stroke="#d9a86a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M26 128h44l10 10H16Z" fill="#c43f2f" stroke="#7d2418" strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 138h64c6 18 10 36 12 54H4c2-18 6-36 12-54Z" fill="#e8c56e" stroke="#9c7a2e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 142l-6 48M34 142l-4 48M46 142v48M58 142l4 48M70 142l6 48" stroke="#c7a24d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 160h72" stroke="#9c7a2e" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h1>Tidy Up</h1>
      <div className="title-progress">
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Loading"
        >
          <div className="progress-fill title-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <button type="button" className="primary-button" disabled={!ready} onClick={onBegin}>
        Start tidying
      </button>
    </section>
  );
}
