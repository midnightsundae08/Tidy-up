import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { reducedMotion } from '../game/audio';
import type { Level, Mode } from '../game/types';
import { formatClock, tidyStars } from '../game/rules';

function useFocusTrap(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const root = ref.current;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')].filter(
        (element) => !element.hasAttribute('disabled'),
      );
    const initial = focusable()[0];
    initial?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return ref;
}

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useFocusTrap(open);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle" ref={ref}>
        <button type="button" className="close-button" onClick={onClose} aria-label="Close help">×</button>
        <span className="modal-illustration" aria-hidden="true">✳</span>
        <div className="eyebrow">The tidy-up guide</div>
        <h2 id="helpTitle">Every thing in its place.</h2>
        <p>There is no timer. Pick up the pieces and help them find their homes.</p>
        <ol className="instructions">
          <li><span>01</span><div><strong>Pick up a tool</strong><small>Drag it off the floor.</small></div></li>
          <li><span>02</span><div><strong>Open a drawer</strong><small>Drag onto a drawer, or tap its handle.</small></div></li>
          <li><span>03</span><div><strong>Put it away</strong><small>Drop it on the matching foam cutout or bin.</small></div></li>
        </ol>
        <button className="primary-button" type="button" onClick={onClose}>Let’s tidy up <span aria-hidden="true">→</span></button>
      </div>
    </div>,
    document.body,
  );
}

export function ResetDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useFocusTrap(open);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="resetTitle" ref={ref}>
        <div className="eyebrow">Start fresh</div>
        <h2 id="resetTitle">Put it all back?</h2>
        <p>Pieces you have already placed will return to the floor. The rest of your campaign stays saved.</p>
        <button className="primary-button" type="button" onClick={onConfirm}>Start this level over</button>
        <button className="text-button" type="button" onClick={onCancel}>Keep going</button>
      </div>
    </div>,
    document.body,
  );
}

export function TimeUpDialog({ open, level, placed, onRetry, onHome }: { open: boolean; level: Level; placed: number; onRetry: () => void; onHome: () => void }) {
  const ref = useFocusTrap(open);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="timeUpTitle" ref={ref}>
        <div className="eyebrow">Time’s up</div>
        <h2 id="timeUpTitle">So close.</h2>
        <p>{placed} of {level.items.length} made it home before the clock ran out. The tools are back on the floor for another go.</p>
        <button className="primary-button" type="button" onClick={onRetry}>Try again <span aria-hidden="true">↻</span></button>
        <button className="text-button" type="button" onClick={onHome}>Back home</button>
      </div>
    </div>,
    document.body,
  );
}

const MODE_LABEL: Record<Mode, string> = {
  campaign: 'Campaign',
  silhouette: 'Silhouette',
  peek: 'One peek',
  mixed: 'Mixed cabinet',
  perfect: 'Perfect fit',
  endless: 'Endless',
};

export function WinDialog({
  open,
  level,
  mode,
  mistakes,
  timeLeft,
  onNext,
  onReplay,
  onNewSeed,
}: {
  open: boolean;
  level: Level;
  mode: Mode;
  mistakes: number;
  timeLeft: number;
  onNext: () => void;
  onReplay: () => void;
  onNewSeed: () => void;
}) {
  const ref = useFocusTrap(open);
  const stars = mode === 'perfect' ? tidyStars(mistakes) : 3;
  const lastRound = mode !== 'campaign' && mode !== 'endless' && level.index >= 2;
  useEffect(() => {
    if (!open || reducedMotion()) return;
    const layer = document.getElementById('confetti');
    if (!layer) return;
    const colors = ['#f7c66c', '#72b889', '#f29e88', '#91bfb3', '#fff9e0', level.accentDeep];
    const pieces: HTMLElement[] = [];
    for (let i = 0; i < 18; i += 1) {
      const node = document.createElement('i');
      node.className = 'confetti-piece';
      node.style.left = `${Math.random() * 100}%`;
      node.style.background = colors[i % colors.length];
      node.style.setProperty('--duration', `${2.2 + Math.random() * 1.6}s`);
      node.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
      node.style.animationDelay = `${Math.random() * 0.25}s`;
      layer.append(node);
      pieces.push(node);
    }
    const timer = window.setTimeout(() => { pieces.forEach((node) => node.remove()); }, 4200);
    return () => {
      window.clearTimeout(timer);
      pieces.forEach((node) => node.remove());
    };
  }, [open, level.accentDeep]);

  if (!open) return null;
  const nextLabel = mode === 'campaign' ? 'Next level' : lastRound ? 'New seed' : 'Next round';
  return createPortal(
    <div className="modal-backdrop">
      <div className="modal win-modal" role="dialog" aria-modal="true" aria-labelledby="winTitle" ref={ref}>
        <div className="win-stars" aria-hidden="true">
          {[0, 1, 2].map((star) => (
            <span key={star} className={star < stars ? 'win-star' : 'win-star is-dim'} style={{ ['--i' as string]: star }}>✦</span>
          ))}
        </div>
        <div className="win-medal" aria-hidden="true">✓</div>
        <div className="eyebrow">{mode === 'perfect' ? `${stars} tidy ${stars === 1 ? 'star' : 'stars'}` : 'Sweet satisfaction'}</div>
        <h2 id="winTitle">Everything is <em>in its place.</em></h2>
        <p>{level.win}</p>
        <p className="win-mode">
          {MODE_LABEL[mode]} · {level.items.length} / {level.items.length}
          {mode === 'endless' ? ` · Round ${level.index + 1}` : ` · ${formatClock(timeLeft)} to spare`}
        </p>
        <button type="button" className="primary-button" onClick={lastRound ? onNewSeed : onNext}>
          {nextLabel} <span aria-hidden="true">{lastRound ? '↻' : '→'}</span>
        </button>
        <button type="button" className="text-button" onClick={onReplay}>
          {mode === 'campaign' ? 'Play this level again' : 'Play this round again'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
