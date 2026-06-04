import type { SpeechSettings } from '../types/speechSettings';
import {
  clearSpeechAbortFlag,
  pauseSpeech,
  speakWithSettings,
  stopSpeech,
  waitSpeechEngineIdle,
} from './speechEngine';

export type PausableSpeechStatus = 'idle' | 'playing' | 'paused';

export type PausableSpeechSession = {
  id: string;
  status: PausableSpeechStatus;
  cancelRequested: boolean;
  pauseWaiters: Array<() => void>;
  segments: string[];
  segmentIndex: number;
  settings: SpeechSettings | null;
};

let activeSession: PausableSpeechSession | null = null;
let runnerPromise: Promise<void> | null = null;

function notifyPauseWaiters(session: PausableSpeechSession): void {
  while (session.pauseWaiters.length > 0) {
    session.pauseWaiters.shift()?.();
  }
}

function waitWhilePaused(session: PausableSpeechSession): Promise<void> {
  if (session.status !== 'paused') return Promise.resolve();
  return new Promise((resolve) => {
    session.pauseWaiters.push(resolve);
  });
}

export function getPausableSpeechSession(
  id: string,
): PausableSpeechSession | null {
  if (activeSession?.id === id) return activeSession;
  return null;
}

export function getPausableSpeechStatus(id: string): PausableSpeechStatus {
  return getPausableSpeechSession(id)?.status ?? 'idle';
}

export function beginPausableSpeechSession(id: string): PausableSpeechSession {
  if (activeSession && activeSession.status !== 'idle') {
    cancelPausableSpeechSession(activeSession);
  }
  const session: PausableSpeechSession = {
    id,
    status: 'idle',
    cancelRequested: false,
    pauseWaiters: [],
    segments: [],
    segmentIndex: 0,
    settings: null,
  };
  activeSession = session;
  return session;
}

export function cancelPausableSpeechSession(
  session?: PausableSpeechSession | null,
): void {
  const target = session ?? activeSession;
  if (!target) return;
  target.cancelRequested = true;
  target.status = 'idle';
  target.segmentIndex = 0;
  clearSpeechAbortFlag();
  notifyPauseWaiters(target);
  stopSpeech();
  runnerPromise = null;
  if (activeSession === target) activeSession = null;
}

export async function pausePausableSpeechSession(
  session: PausableSpeechSession,
): Promise<boolean> {
  if (session.status !== 'playing') return false;
  session.status = 'paused';
  await pauseSpeech();
  return true;
}

export async function resumePausableSpeechSession(
  session: PausableSpeechSession,
): Promise<boolean> {
  if (session.status !== 'paused') return false;
  if (!session.settings || session.segments.length === 0) return false;

  session.status = 'playing';
  session.cancelRequested = false;
  clearSpeechAbortFlag();
  await waitSpeechEngineIdle();
  notifyPauseWaiters(session);

  if (!runnerPromise) {
    void runPausableSpeechRunner(session);
  }

  return true;
}

async function speakOnce(
  text: string,
  settings: SpeechSettings,
  session: PausableSpeechSession,
): Promise<'done' | 'cancelled'> {
  while (true) {
    if (session.cancelRequested) return 'cancelled';
    await waitWhilePaused(session);
    if (session.cancelRequested) return 'cancelled';

    const result = await speakWithSettings(text, settings);
    if (session.cancelRequested) return 'cancelled';

    if (result === 'aborted' || session.status === 'paused') {
      await waitSpeechEngineIdle();
      continue;
    }

    return 'done';
  }
}

async function runPausableSpeechRunner(
  session: PausableSpeechSession,
): Promise<void> {
  const settings = session.settings;
  if (!settings) return;

  session.cancelRequested = false;
  if (session.status !== 'paused') {
    session.status = 'playing';
  }

  try {
    while (session.segmentIndex < session.segments.length) {
      if (session.cancelRequested) return;

      const text = session.segments[session.segmentIndex]?.trim() ?? '';
      if (!text) {
        session.segmentIndex += 1;
        continue;
      }

      const outcome = await speakOnce(text, settings, session);
      if (session.cancelRequested) return;

      if (outcome === 'done' && session.status === 'playing') {
        session.segmentIndex += 1;
      }
    }
  } finally {
    runnerPromise = null;

    if (session.cancelRequested) {
      session.status = 'idle';
      session.segmentIndex = 0;
      if (activeSession === session) activeSession = null;
      return;
    }

    if (
      session.status === 'playing' &&
      session.segmentIndex >= session.segments.length
    ) {
      session.status = 'idle';
      session.segmentIndex = 0;
      if (activeSession === session) activeSession = null;
    }
  }
}

/** 일시정지 가능한 TTS — 일시정지 시 구간 인덱스 유지, 이어듣기 시 같은 위치부터 */
export function runPausableSpeechSegments(
  segments: string[],
  settings: SpeechSettings,
  session: PausableSpeechSession,
): Promise<void> {
  session.segments = segments;
  session.settings = settings;
  session.segmentIndex = 0;
  session.cancelRequested = false;
  session.status = 'playing';

  if (runnerPromise) {
    return runnerPromise;
  }

  runnerPromise = runPausableSpeechRunner(session);
  return runnerPromise;
}
