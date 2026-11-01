import { useEffect, useMemo, useRef, useState } from 'react';
import { playFanfare, playTone, reducedMotion, resumeAudio } from './game/audio';
import { beginNextRoundMusic, duckMusic, ensureMenuTheme, setMusicMuted, startGameplay } from './game/music';
import { CAMPAIGN_SEED } from './game/generate';
import { getLevel } from './game/levels';
import { evaluatePlace, nextHintPiece, targetFor, timeBudget } from './game/rules';
import { browserStore, emptySave, readSave, writeSave } from './game/storage';
import type { Mode, SaveData, SaveStatus, TargetType } from './game/types';
import { BrandMark } from './components/Art';
import { CampaignScreen } from './components/CampaignScreen';
import { ChallengeScreen } from './components/ChallengeScreen';
import { HelpDialog, ResetDialog, TimeUpDialog, WinDialog } from './components/Dialogs';
import { HomeScreen } from './components/HomeScreen';
import { PlayScreen, SWEEP_MS } from './components/PlayScreen';
import { TitleScreen } from './components/TitleScreen';

type Screen = 'title' | 'home' | 'campaign' | 'challenges' | 'play';

function loadInitial(): { save: SaveData; status: SaveStatus; remembered: boolean } {
  try {
    const result = readSave(browserStore());
    if (result.save) return { save: result.save, status: 'saved', remembered: true };
    return { save: emptySave(), status: 'empty', remembered: false };
  } catch {
    return { save: emptySave(), status: 'unavailable', remembered: false };
  }
}

export function App() {
  const initial = useMemo(loadInitial, []);
  const [screen, setScreen] = useState<Screen>('title');
  const celebratedRound = useRef(false);
  const [save, setSave] = useState<SaveData>(initial.save);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initial.status);
  const [remembered, setRemembered] = useState(initial.remembered);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const level = getLevel(save.mode, save.seed, save.level);
  const timed = save.mode !== 'endless';
  const budget = timeBudget(save.level, level.items.length);
  const timeLeft = Math.max(0, budget - save.elapsed);
  const finished = save.done.length === level.items.length;
  const timeUp = timed && screen === 'play' && !finished && timeLeft <= 0;
  const dialogOpen = helpOpen || winOpen || resetOpen || timeUp;

  useEffect(() => {
    if (!timed || screen !== 'play' || dialogOpen || finished || timeUp) return;
    const started = Date.now();
    const base = save.elapsed;
    const tick = window.setInterval(() => {
      const next = base + Math.floor((Date.now() - started) / 1000);
      setSave((current) => (current.elapsed === next ? current : { ...current, elapsed: next }));
    }, 250);
    return () => window.clearInterval(tick);
    // Elapsed is read once when the tick starts; it restarts whenever play pauses or resumes.
  }, [timed, screen, dialogOpen, finished, timeUp, save.mode, save.seed, save.level]);

  useEffect(() => {
    document.body.classList.toggle('is-playing', screen === 'play');
    return () => document.body.classList.remove('is-playing');
  }, [screen]);

  useEffect(() => {
    if (!remembered) return;
    const status = writeSave(browserStore(), save);
    setSaveStatus(status === 'saved' ? 'saved' : 'unavailable');
  }, [remembered, save]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (resetOpen) {
        setResetOpen(false);
        return;
      }
      if (winOpen) return;
      setSelectedId(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [helpOpen, resetOpen, winOpen]);

  useEffect(() => {
    setMusicMuted(save.muted);
  }, [save.muted]);

  useEffect(() => {
    if (screen === 'title') return;
    if (screen === 'play') startGameplay();
    else ensureMenuTheme();
  }, [screen]);

  useEffect(() => {
    if (winOpen && screen === 'play') {
      if (!celebratedRound.current) {
        celebratedRound.current = true;
        duckMusic();
        playFanfare(save.muted);
      }
      return;
    }
    celebratedRound.current = false;
  }, [winOpen, screen, save.muted]);

  function patch(partial: Partial<SaveData>) {
    setSave((current) => ({ ...current, ...partial }));
  }

  function begin(next: SaveData, resume: boolean) {
    setRemembered(true);
    setSave(next);
    setSelectedId(null);
    setActiveDrawer(0);
    setResetOpen(false);
    const board = getLevel(next.mode, next.seed, next.level);
    setWinOpen(resume && next.done.length > 0 && next.done.length === board.items.length);
    setScreen('play');
  }

  function fresh(mode: Mode, seed: string, index: number) {
    begin({ ...save, mode, seed, level: index, done: [], mistakes: 0, hintsUsed: 0, elapsed: 0 }, false);
  }

  function attempt(id: string, key: string, type: TargetType, drawerIndex: number): 'wrong' | { remaining: number } {
    if (id.startsWith('clutter-')) {
      patch({ mistakes: save.mistakes + 1 });
      return 'wrong';
    }
    const result = evaluatePlace(level, new Set(save.done), id, drawerIndex, key, type);
    if (result !== 'placed') {
      if (result === 'wrong') patch({ mistakes: save.mistakes + 1 });
      return 'wrong';
    }
    const done = [...save.done, id];
    patch({ done });
    setSelectedId(null);
    const remaining = level.items.length - done.length;
    if (remaining === 0) {
      // Let the last tool settle, then give the broom time to clear the clutter before celebrating.
      const wait = reducedMotion() ? 0 : level.clutter.length > 0 ? 560 + SWEEP_MS + 300 : 560;
      window.setTimeout(() => setWinOpen(true), wait);
    }
    return { remaining };
  }

  function hint(): 'denied' | { id: string; key: string; message: string } {
    if (save.mode === 'peek' && save.hintsUsed >= 1) return 'denied';
    const item = nextHintPiece(level, new Set(save.done), selectedId);
    if (!item) return 'denied';
    const target = targetFor(level, item);
    if (save.mode === 'peek') patch({ hintsUsed: save.hintsUsed + 1 });
    setSelectedId(item.id);
    setActiveDrawer(item.drawer);
    const drawerName = level.drawers[item.drawer]?.tab.toLowerCase() ?? 'drawer';
    const spot = target?.label.toLowerCase() ?? 'matching spot';
    return {
      id: item.id,
      key: item.target,
      message: `Hint: ${item.label} belongs in the ${drawerName}, in the ${spot} spot.`,
    };
  }

  function onBegin() {
    setMusicMuted(save.muted);
    void resumeAudio();
    ensureMenuTheme();
    setScreen('home');
  }

  return (
    <>
      <div className={screen === 'play' ? 'page-shell is-playing' : 'page-shell'} inert={dialogOpen ? true : undefined}>
        {screen === 'title' ? null : (
        <header className="site-header">
          <button type="button" className="brand" onClick={() => { setWinOpen(false); setScreen('home'); }}>
            <BrandMark />
            <span className="brand-words"><strong>Everything</strong><small>in its place<span className="brand-dot">.</span></small></span>
          </button>
          <div className="header-actions">
            {screen === 'play' ? (
              <span className="save-status">
                <span className={saveStatus === 'unavailable' ? 'status-pip is-warn' : 'status-pip'} />
                <span className="save-label">{saveStatus === 'unavailable' ? 'not saved' : 'progress autosaves'}</span>
              </span>
            ) : null}
            <button type="button" className="icon-button" aria-label="How to play" onClick={() => setHelpOpen(true)}>?</button>
            <button
              type="button"
              className="icon-button sound-button"
              aria-pressed={!save.muted}
              aria-label={save.muted ? 'Turn sound on' : 'Turn sound off'}
              onClick={() => {
                const muted = !save.muted;
                patch({ muted });
                if (!muted) playTone(true, false);
              }}
            >
              {save.muted ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM16 10l5 5M21 10l-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
              )}
            </button>
          </div>
        </header>
        )}

        {screen === 'title' ? <TitleScreen onBegin={onBegin} /> : null}

        {screen === 'home' ? (
          <HomeScreen
            hasSave={remembered}
            onContinue={() => begin(save, true)}
            onCampaign={() => setScreen('campaign')}
            onEndless={() => {
              if (remembered && save.mode === 'endless') begin(save, true);
              else fresh('endless', `run-${Date.now().toString(36)}`, 0);
            }}
            onChallenges={() => setScreen('challenges')}
          />
        ) : null}
        {screen === 'campaign' ? (
          <CampaignScreen
            save={remembered ? save : null}
            onBack={() => setScreen('home')}
            onPlay={(index) => {
              if (remembered && save.mode === 'campaign' && save.level === index) begin(save, true);
              else fresh('campaign', CAMPAIGN_SEED, index);
            }}
          />
        ) : null}
        {screen === 'challenges' ? (
          <ChallengeScreen
            save={remembered ? save : null}
            onBack={() => setScreen('home')}
            onStart={(mode) => {
              if (remembered && save.mode === mode) begin(save, true);
              else fresh(mode, `run-${Date.now().toString(36)}`, 0);
            }}
          />
        ) : null}
        {screen === 'play' ? (
          <PlayScreen
            level={level}
            mode={save.mode}
            done={save.done}
            hintsUsed={save.hintsUsed}
            muted={save.muted}
            activeDrawer={activeDrawer}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDrawer={setActiveDrawer}
            onAttempt={attempt}
            onHint={hint}
            onResetRequest={() => setResetOpen(true)}
            timeLeft={timeLeft}
            timeBudget={budget}
          />
        ) : null}
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ResetDialog
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          setWinOpen(false);
          setSelectedId(null);
          setActiveDrawer(0);
          patch({ done: [], mistakes: 0, hintsUsed: 0, elapsed: 0 });
        }}
      />
      <TimeUpDialog
        open={timeUp}
        level={level}
        placed={save.done.length}
        onRetry={() => {
          setSelectedId(null);
          setActiveDrawer(0);
          patch({ done: [], mistakes: 0, hintsUsed: 0, elapsed: 0 });
        }}
        onHome={() => {
          patch({ done: [], mistakes: 0, hintsUsed: 0, elapsed: 0 });
          setScreen('home');
        }}
      />
      <WinDialog
        open={winOpen && screen === 'play'}
        level={level}
        mode={save.mode}
        mistakes={save.mistakes}
        timeLeft={timeLeft}
        onReplay={() => {
          beginNextRoundMusic();
          setWinOpen(false);
          setSelectedId(null);
          setActiveDrawer(0);
          patch({ done: [], mistakes: 0, hintsUsed: 0, elapsed: 0 });
        }}
        onNext={() => {
          beginNextRoundMusic();
          setWinOpen(false);
          setSelectedId(null);
          setActiveDrawer(0);
          patch({ level: save.level + 1, done: [], mistakes: 0, hintsUsed: 0, elapsed: 0 });
        }}
        onNewSeed={() => {
          beginNextRoundMusic();
          setWinOpen(false);
          fresh(save.mode, `run-${Date.now().toString(36)}`, 0);
        }}
      />
      <div className="confetti-layer" id="confetti" aria-hidden="true" />
    </>
  );
}
