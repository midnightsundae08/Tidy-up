import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { playTone, reducedMotion } from '../game/audio';
import { formatClock, pieceById } from '../game/rules';
import { scatterSpots, type Spot } from '../game/scatter';
import type { Level, Mode, TargetType } from '../game/types';
import { Art } from './Art';

const PRAISE = ['Perfect fit!', 'Right where it belongs!', 'So satisfying!'];
/** How long the broom takes to cross the floor once the last tool is home. */
export const SWEEP_MS = 1800;

function Broom() {
  return (
    <svg className="broom" viewBox="0 0 120 200" aria-hidden="true" focusable="false">
      <path d="M48 6v124" stroke="#a9763f" strokeWidth="9" strokeLinecap="round" />
      <path d="M46 8v120" stroke="#d9a86a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 128h44l10 10H16Z" fill="#c43f2f" stroke="#7d2418" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 138h64c6 18 10 36 12 54H4c2-18 6-36 12-54Z" fill="#e8c56e" stroke="#9c7a2e" strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 142l-6 48M34 142l-4 48M46 142v48M58 142l4 48M70 142l6 48" stroke="#c7a24d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 160h72" stroke="#9c7a2e" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

type Drag = {
  id: string;
  pointerId: number;
  originX: number;
  originY: number;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  moving: boolean;
  frame: number;
};

export function PlayScreen({
  level,
  mode,
  done,
  hintsUsed,
  muted,
  activeDrawer,
  selectedId,
  onSelect,
  onDrawer,
  onAttempt,
  onHint,
  onResetRequest,
  timeLeft,
  timeBudget,
}: {
  level: Level;
  mode: Mode;
  done: string[];
  hintsUsed: number;
  muted: boolean;
  activeDrawer: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDrawer: (index: number) => void;
  onAttempt: (id: string, key: string, type: TargetType, drawerIndex: number) => 'wrong' | { remaining: number };
  onHint: () => 'denied' | { id: string; key: string; message: string };
  onResetRequest: () => void;
  timeLeft: number;
  timeBudget: number;
}) {
  const doneSet = new Set(done);
  const remaining = level.items.filter((item) => !doneSet.has(item.id));
  const [entering, setEntering] = useState(true);
  const [guidance, setGuidance] = useState('Drag a tool into its foam cutout or bin.');
  const [toast, setToast] = useState<{ text: string; trouble: boolean } | null>(null);
  const [drops, setDrops] = useState<Record<string, Pick<Spot, 'x' | 'y' | 'rot'>>>({});
  const [ghostKind, setGhostKind] = useState<string | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [hintedKey, setHintedKey] = useState<string | null>(null);
  const [glint, setGlint] = useState(false);
  const [hintShake, setHintShake] = useState(false);
  const toastTimer = useRef(0);
  const focusNext = useRef<string | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const drawerRef = useRef(activeDrawer);
  drawerRef.current = activeDrawer;
  const drawer = level.drawers[activeDrawer];
  const placedCount = done.length;
  const percent = Math.round((placedCount / level.items.length) * 100);
  const peekLeft = mode === 'peek' ? Math.max(0, 1 - hintsUsed) : null;
  const scatterKey = `${mode}:${level.index}:${level.name}:${level.items.map((item) => item.id).join('|')}`;
  const [floorAspect, setFloorAspect] = useState(1.4);
  const floorRef = useRef<HTMLDivElement>(null);
  const floorThings = useMemo(
    () => [
      ...level.items.map((item) => ({ id: item.id, kind: item.kind, label: item.label, clutter: false })),
      ...level.clutter.map((item) => ({ id: item.id, kind: item.kind, label: item.label, clutter: true })),
    ],
    [level],
  );
  const roundedAspect = Math.round(floorAspect * 4) / 4;
  const spots = useMemo(() => scatterSpots(scatterKey, floorThings.length, roundedAspect), [scatterKey, floorThings.length, roundedAspect]);
  const spotFor = (id: string) => drops[id] ?? spots[floorThings.findIndex((thing) => thing.id === id)];
  const lowTime = timeLeft <= Math.max(15, timeBudget * 0.2);
  const sweeping = done.length === level.items.length && level.clutter.length > 0;
  // The broom crosses the floor from -20% to 120% over SWEEP_MS; each bit of clutter leaves as the bristles reach it.
  const sweepDelay = (x: number) => Math.max(0, Math.round(((x + 20) / 140) * SWEEP_MS) - 340);

  useEffect(() => {
    const floor = floorRef.current;
    if (!floor || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const rect = floor.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setFloorAspect(rect.width / rect.height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(floor);
    return () => observer.disconnect();
  }, []);
  const drawerHover = useRef(0);
  const drawerHoverIndex = useRef(-1);

  useEffect(() => {
    setEntering(true);
    setGuidance('Drag a tool into its foam cutout or bin.');
    setHintedKey(null);
    setDrops({});
    const timer = window.setTimeout(() => setEntering(false), reducedMotion() ? 0 : 720);
    return () => window.clearTimeout(timer);
  }, [scatterKey]);

  useEffect(() => {
    if (done.length === 0) setDrops({});
  }, [done.length, scatterKey]);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`piece-${selectedId}`)?.focus({ preventScroll: true });
  }, [selectedId]);

  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    focusNext.current = null;
    document.getElementById(`piece-${id}`)?.focus();
  }, [done]);

  useEffect(() => {
    if (!ghostKind) return;
    const drag = dragRef.current;
    if (!drag || !ghostRef.current) return;
    ghostRef.current.style.left = `${drag.x}px`;
    ghostRef.current.style.top = `${drag.y}px`;
    const step = () => {
      const current = dragRef.current;
      if (!current) return;
      const ease = reducedMotion() ? 1 : 0.38;
      current.x += (current.pointerX - current.x) * ease;
      current.y += (current.pointerY - current.y) * ease;
      if (ghostRef.current) {
        ghostRef.current.style.left = `${current.x}px`;
        ghostRef.current.style.top = `${current.y}px`;
      }
      current.frame = requestAnimationFrame(step);
    };
    drag.frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(drag.frame);
  }, [ghostKind]);

  function showToast(text: string, trouble = false) {
    setToast({ text, trouble });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2100);
  }

  function praise(left: number) {
    if (left === 1) return 'One more thing put away!';
    if (left === 0) return 'You did it!';
    return PRAISE[Math.floor(Math.random() * PRAISE.length)];
  }

  function markWrong(key: string) {
    setWrongKey(null);
    window.requestAnimationFrame(() => setWrongKey(key));
  }

  function showDrawer(index: number) {
    drawerRef.current = index;
    onDrawer(index);
  }

  function tryPlace(id: string, key: string, type: TargetType) {
    const result = onAttempt(id, key, type, drawerRef.current);
    if (result === 'wrong') {
      markWrong(key);
      playTone(false, muted);
      const junk = level.clutter.find((thing) => thing.id === id);
      if (junk) {
        showToast(`That’s just a ${junk.label.toLowerCase()}. It stays on the floor.`, true);
        setGuidance('Some things on the floor are only clutter. Leave them be.');
        return;
      }
      const item = pieceById(level, id);
      showToast('Not quite! Try matching the shape or label.', true);
      setGuidance(item ? `That doesn’t fit ${item.label.toLowerCase()}. Drag it to another spot or drawer.` : 'Try another spot.');
      return;
    }
    playTone(true, muted);
    setGlint(true);
    window.setTimeout(() => setGlint(false), 520);
    showToast(praise(result.remaining));
    const item = pieceById(level, id);
    setGuidance(result.remaining === 0 ? 'You did it!' : `${item?.label ?? 'That piece'} is home. Keep going.`);
    const next = level.items.find((piece) => piece.id !== id && !doneSet.has(piece.id));
    focusNext.current = next?.id ?? null;
  }

  function launchGlow(fromId: string, key: string) {
    if (reducedMotion()) return;
    const from = document.getElementById(`piece-${fromId}`)?.getBoundingClientRect();
    const to = document.querySelector<HTMLElement>(`[data-target="${CSS.escape(key)}"]`)?.getBoundingClientRect();
    if (!from || !to) return;
    const glow = document.createElement('i');
    glow.className = 'hint-glow';
    glow.style.left = `${from.left + from.width / 2}px`;
    glow.style.top = `${from.top + from.height / 2}px`;
    document.body.append(glow);
    requestAnimationFrame(() => {
      glow.style.left = `${to.left + to.width / 2}px`;
      glow.style.top = `${to.top + to.height / 2}px`;
    });
    window.setTimeout(() => glow.remove(), 520);
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const piece = (event.target as HTMLElement).closest<HTMLElement>('[data-item]');
    if (!piece?.dataset.item) return;
    piece.setPointerCapture(event.pointerId);
    const item = floorThings.find((thing) => thing.id === piece.dataset.item);
    dragRef.current = {
      id: piece.dataset.item,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moving: false,
      frame: 0,
    };
    document.body.classList.add('is-dragging');
    if (item) setGhostKind(item.kind);
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.pointerX = event.clientX;
    drag.pointerY = event.clientY;
    const distance = Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY);
    if (!drag.moving && distance > 6) {
      drag.moving = true;
      event.preventDefault();
    }
    if (drag.moving) {
      event.preventDefault();
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const tab = under?.closest<HTMLElement>('[data-drawer]');
      const index = tab ? Number(tab.dataset.drawer) : -1;
      if (index >= 0 && index !== drawerRef.current) {
        if (drawerHoverIndex.current !== index) {
          window.clearTimeout(drawerHover.current);
          drawerHoverIndex.current = index;
          drawerHover.current = window.setTimeout(() => {
            if (dragRef.current?.moving) showDrawer(index);
          }, 180);
        }
      } else {
        window.clearTimeout(drawerHover.current);
        drawerHoverIndex.current = -1;
      }
    }
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    document.body.classList.remove('is-dragging');
    window.clearTimeout(drawerHover.current);
    drawerHoverIndex.current = -1;
    if (drag.moving) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      event.preventDefault();
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const target = under?.closest<HTMLElement>('[data-target]');
      const tab = under?.closest<HTMLElement>('[data-drawer]');
      if (tab?.dataset.drawer) showDrawer(Number(tab.dataset.drawer));
      const floor = floorRef.current;
      const onFloor = Boolean(floor && under && floor.contains(under));
      if (target?.dataset.target && target.dataset.targetType) {
        tryPlace(drag.id, target.dataset.target, target.dataset.targetType as TargetType);
        setGhostKind(null);
      } else if (onFloor && floor) {
        const rect = floor.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
        const rot = spotFor(drag.id)?.rot ?? 0;
        setDrops((current) => ({ ...current, [drag.id]: { x, y, rot } }));
        setGhostKind(null);
      } else {
        const home = document.getElementById(`piece-${drag.id}`)?.getBoundingClientRect();
        if (ghostRef.current && home && !reducedMotion()) {
          ghostRef.current.style.transition = 'left 280ms ease, top 280ms ease';
          ghostRef.current.style.left = `${home.left + home.width / 2}px`;
          ghostRef.current.style.top = `${home.top + home.height / 2}px`;
          window.setTimeout(() => setGhostKind(null), 280);
        } else {
          setGhostKind(null);
        }
      }
    } else {
      setGhostKind(null);
    }
    cancelAnimationFrame(drag.frame);
    dragRef.current = null;
  }
  const eyebrow = mode === 'campaign'
    ? `Level ${level.index + 1} · ${level.short}`
    : `Round ${level.index + 1} of 3 · ${level.short}`;

  return (
    <section className="screen play" style={{ '--accent': level.accent, '--accent-deep': level.accentDeep } as CSSProperties}>
      <div className="level-summary">
        <div className="level-heading">
          <div className="level-number">{String(level.index + 1).padStart(2, '0')}</div>
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2>{level.name}</h2>
            <p>{level.subtitle}</p>
          </div>
        </div>
        <div className="progress-wrap">
          <div className="progress-line">
            <strong>
              <span className="progress-long">{placedCount} of {level.items.length} put away</span>
              <span className="progress-short">{placedCount}/{level.items.length}</span>
            </strong>
            <span>{percent}%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Level completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className={glint ? 'progress-fill is-glint' : 'progress-fill'} style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className={lowTime ? 'clock is-low' : 'clock'} role="timer" aria-live={lowTime ? 'assertive' : 'off'} aria-label={`${formatClock(timeLeft)} left`}>
          <span aria-hidden="true">⏱</span> {formatClock(timeLeft)}
        </div>
        <button type="button" className="text-button reset-play" onClick={onResetRequest}>Start over</button>
      </div>

      <div className="game-layout">
        <section className="panel workbench" aria-labelledby="benchTitle">
          <div className="panel-title-row">
            <div>
              <div className="panel-overline"><span className="little-circle orange" /> The floor</div>
              <h3 id="benchTitle">The floor</h3>
            </div>
            <span className="subtle-pill">{remaining.length} {remaining.length === 1 ? 'tool' : 'tools'}</span>
          </div>
          <p className="panel-hint">Drag each tool into the toolbox.</p>
          <div className={sweeping ? 'bench-inner floor-surface is-sweeping' : 'bench-inner floor-surface'} ref={floorRef} style={{ ['--sweep-ms' as string]: `${SWEEP_MS}ms` }}>
            <div
              className="scatter"
              aria-label="Items that need to be put away"
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onClick={(event) => {
                const piece = (event.target as HTMLElement).closest<HTMLElement>('[data-item]');
                if (!piece?.dataset.item) return;
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                const id = piece.dataset.item;
                if (id.startsWith('clutter-')) {
                  setGuidance('That is only clutter. The tools are what need a home.');
                  return;
                }
                onSelect(selectedId === id ? null : id);
                if (selectedId === id) setGuidance('Drag a tool into its foam cutout or bin.');
                else {
                  const item = pieceById(level, id);
                  setGuidance(item ? `${item.label} selected. Drag it into the toolbox.` : 'Drag a tool into its foam cutout or bin.');
                }
              }}
            >
              {floorThings.filter((thing) => thing.clutter || !doneSet.has(thing.id)).map((thing, order) => {
                const spot = spotFor(thing.id);
                const swept = sweeping && thing.clutter;
                return (
                  <button
                    key={thing.id}
                    id={`piece-${thing.id}`}
                    type="button"
                    className={`piece piece-floor${thing.clutter ? ' is-clutter' : ''}${swept ? ' is-swept' : ''}${selectedId === thing.id ? ' is-selected' : ''}${entering && !swept ? ' is-entering' : ''}${ghostKind && dragRef.current?.id === thing.id ? ' is-faded' : ''}`}
                    data-item={thing.id}
                    tabIndex={swept ? -1 : undefined}
                    style={{
                      left: `clamp(calc(var(--piece-half-w) + 6px), ${spot?.x ?? 50}%, calc(100% - var(--piece-half-w) - 6px))`,
                      top: `clamp(calc(var(--piece-half-h) + 6px), ${spot?.y ?? 50}%, calc(100% - var(--piece-half-h) - 6px))`,
                      ['--rot' as string]: `${spot?.rot ?? 0}deg`,
                      ['--delay' as string]: swept ? `${sweepDelay(spot?.x ?? 50)}ms` : `${order * 30}ms`,
                    }}
                    aria-pressed={thing.clutter ? undefined : selectedId === thing.id}
                    aria-label={`Drag ${thing.label}`}
                  >
                    <span className="piece-art"><Art kind={thing.kind} /></span>
                    <span className="piece-name">{thing.label}</span>
                  </button>
                );
              })}
            </div>
            {sweeping ? <Broom /> : null}
            {remaining.length === 0 ? (
              <div className={sweeping ? 'bench-empty is-after-sweep' : 'bench-empty'}>
                <div className="empty-icon" aria-hidden="true">✦</div>
                <strong>Look at that!</strong>
                <span>{level.empty}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel tool-panel" aria-labelledby="toolboxTitle">
          <div className="panel-title-row">
            <div>
              <div className="panel-overline"><span className="little-circle green" /> The organizer</div>
              <h3 id="toolboxTitle">{level.organizer}</h3>
            </div>
            <button
              className={hintShake ? 'small-button is-shaking' : 'small-button'}
              type="button"
              onClick={() => {
                const result = onHint();
                if (result === 'denied') {
                  setHintShake(true);
                  window.setTimeout(() => setHintShake(false), 320);
                  showToast('That was your one peek.', true);
                  return;
                }
                onSelect(result.id);
                showDrawer(level.items.find((item) => item.id === result.id)?.drawer ?? 0);
                setHintedKey(result.key);
                window.setTimeout(() => setHintedKey(null), 1600);
                setGuidance(result.message);
                showToast('Drag it to the glowing spot.');
                window.requestAnimationFrame(() => launchGlow(result.id, result.key));
              }}
            >
              {peekLeft === null ? '✦ Hint' : peekLeft === 1 ? '✦ One peek' : 'No peeks left'}
            </button>
          </div>
          <p className="panel-hint">{level.organizerDetail}</p>
          <div className="cabinet" id="cabinet" style={{ '--accent': level.accent, '--accent-deep': level.accentDeep } as CSSProperties}>
            <div className="cabinet-lid"><span className="cabinet-badge">EIP <span>✳</span></span><span className="cabinet-screws" aria-hidden="true">⊙ ⊙</span></div>
            <div className="cabinet-interior">
              <div className="drawer-tabs" role="group" aria-label="Cabinet drawers">
                {level.drawers.map((entry, index) => {
                  const all = level.items.filter((item) => item.drawer === index);
                  const filled = all.filter((item) => doneSet.has(item.id)).length;
                  const open = activeDrawer === index;
                  return (
                    <button
                      key={entry.tab + entry.name}
                      type="button"
                      className={`drawer-tab${open ? ' is-active' : ''}${filled === all.length ? ' is-complete' : ''}`}
                      data-drawer={index}
                      aria-pressed={open}
                      aria-expanded={open}
                      onClick={() => showDrawer(index)}
                    >
                      <span className="drawer-tab-name">{entry.tab}</span>
                      <span className="drawer-count">{filled}/{all.length}{filled === all.length ? ' ✓' : ''}</span>
                      <span className="drawer-handle" />
                    </button>
                  );
                })}
              </div>
              {activeDrawer < 0 || !drawer ? (
                <div className="drawer-closed">
                  <div className="closed-symbol" aria-hidden="true">≡</div>
                  <strong>All tucked away.</strong>
                  <span>Tap a drawer handle to open it.</span>
                </div>
              ) : (
                <div className="drawer-body" key={activeDrawer}>
                  <div className="drawer-label">{drawer.name}<span>Drawer {activeDrawer + 1} / {level.drawers.length}</span></div>
                  <p className="drawer-description">{drawer.description}</p>
                  <div className="foam-board">
                    <div className={drawer.targets[0]?.type === 'bin' ? 'bins' : 'slots'}>
                      {drawer.targets.map((target) => {
                        const placed = level.items.filter((item) => item.drawer === activeDrawer && item.target === target.key && doneSet.has(item.id)).length;
                        const necessary = level.items.filter((item) => item.drawer === activeDrawer && item.target === target.key).length;
                        const filled = target.type === 'slot' ? placed > 0 : placed === necessary;
                        const hidden = mode === 'silhouette' && !filled;
                        const className = `${target.type === 'bin' ? 'bin' : 'slot'}${filled ? ' is-filled' : ''}${wrongKey === target.key ? ' is-wrong' : ''}${hintedKey === target.key ? ' is-hinted' : ''}`;
                        return (
                          <button
                            key={target.key}
                            type="button"
                            className={className}
                            data-target={target.key}
                            data-target-type={target.type}
                            aria-label={hidden
                              ? `${target.type === 'bin' ? 'Sorting bin' : 'Foam cutout'}, ${placed} of ${necessary}`
                              : `${target.label}, ${target.type === 'bin' ? `${placed} of ${necessary}` : filled ? 'filled' : 'empty'}`}
                          >
                            {target.type === 'bin' ? (
                              <>
                                <Art kind={target.kind} shadow={!filled} />
                                <span className="bin-title">{hidden ? 'Bin' : target.label}</span>
                                <span className="bin-count">{placed}/{necessary} sorted</span>
                                <span className="bin-pieces">
                                  {level.items.filter((item) => item.drawer === activeDrawer && item.target === target.key && doneSet.has(item.id)).map((item) => (
                                    <Art key={item.id} kind={target.kind} />
                                  ))}
                                </span>
                                {filled ? <span className="bin-check">✓</span> : null}
                              </>
                            ) : (
                              <>
                                {filled ? <span className="slot-check">✓</span> : null}
                                <Art kind={target.kind} shadow={!filled} />
                                <span className="slot-label">{hidden ? 'Cutout' : target.label}</span>
                                <span className="slot-prompt">{filled ? 'Perfect fit' : 'Foam cutout'}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div className="cabinet-underlay"><span>Everything has a home</span></div>
            </div>
          </div>
          <div className="guidance" aria-live="polite"><span aria-hidden="true">✦</span><span>{guidance}</span></div>
        </section>
      </div>

      <div className={toast ? 'toast is-visible' : 'toast'} role="status" aria-live="polite" style={{ background: toast?.trouble ? '#8a4e40' : '#204c40' }}>
        {toast?.text}
      </div>
      {ghostKind ? (
        <div className="drag-ghost" ref={ghostRef}>
          <Art kind={ghostKind} />
        </div>
      ) : null}
    </section>
  );
}
