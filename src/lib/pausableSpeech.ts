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
};

let activeSession: PausableSpeechSession | null = null;

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
  clearSpeechAbortFlag();
  notifyPauseWaiters(target);
  stopSpeech();
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
  session.status = 'playing';
  clearSpeechAbortFlag();
  await waitSpeechEngineIdle();
  notifyPauseWaiters(session);
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
    if (result === 'done') return 'done';
    await waitSpeechEngineIdle();
    await waitWhilePaused(session);
  }
}

/** 일시정지 가능한 TTS — 구간마다 stop 후 재개 시 같은 구간부터 다시 읽음 */
export async function runPausableSpeechSegments(
  segments: string[],
  settings: SpeechSettings,
  session: PausableSpeechSession,
): Promise<void> {
  session.cancelRequested = false;
  session.status = 'playing';

  try {
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      if ((await speakOnce(trimmed, settings, session)) === 'cancelled') {
        return;
      }
    }
  } finally {
    if (session.cancelRequested) {
      session.status = 'idle';
      if (activeSession === session) activeSession = null;
      return;
    }
    if (session.status === 'playing') {
      session.status = 'idle';
      if (activeSession === session) activeSession = null;
    }
  }
}
