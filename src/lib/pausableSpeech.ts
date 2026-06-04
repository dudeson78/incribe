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
  segments: string[];
  segmentIndex: number;
  settings: SpeechSettings | null;
  /** 새 러너가 시작될 때마다 증가. 오래된 러너를 무효화한다. */
  runToken: number;
};

let activeSession: PausableSpeechSession | null = null;
let runnerPromise: Promise<void> | null = null;

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
    segments: [],
    segmentIndex: 0,
    settings: null,
    runToken: 0,
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
  target.runToken += 1;
  stopSpeech();
  runnerPromise = null;
  if (activeSession === target) activeSession = null;
}

export async function pausePausableSpeechSession(
  session: PausableSpeechSession,
): Promise<boolean> {
  if (session.status !== 'playing') return false;
  // status를 먼저 바꿔야 러너가 깨어났을 때 인덱스를 보존한 채 종료한다.
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

  // 보존된 segmentIndex부터 새 러너 시작 (처음으로 돌아가지 않는다).
  runnerPromise = runPausableSpeechRunner(session);
  return true;
}

async function runPausableSpeechRunner(
  session: PausableSpeechSession,
): Promise<void> {
  const settings = session.settings;
  if (!settings) return;

  const myToken = (session.runToken += 1);
  session.cancelRequested = false;
  session.status = 'playing';

  try {
    while (session.segmentIndex < session.segments.length) {
      if (session.cancelRequested || session.runToken !== myToken) return;
      if (session.status !== 'playing') return;

      const text = session.segments[session.segmentIndex]?.trim() ?? '';
      if (!text) {
        session.segmentIndex += 1;
        continue;
      }

      const result = await speakWithSettings(text, settings);

      // 다른 러너로 교체됐거나 취소/일시정지된 경우: 인덱스 보존 후 종료.
      if (session.cancelRequested || session.runToken !== myToken) return;
      if (session.status !== 'playing') return;

      if (result === 'done') {
        session.segmentIndex += 1;
      } else {
        // 의도치 않은 중단: 엔진 정리 후 같은 구간 재시도.
        await waitSpeechEngineIdle();
      }
    }

    session.status = 'idle';
    session.segmentIndex = 0;
    if (activeSession === session) activeSession = null;
  } finally {
    if (session.runToken === myToken) runnerPromise = null;
  }
}

/** 일시정지 가능한 TTS — 일시정지 시 구간 인덱스 보존, 이어듣기 시 그 위치부터 재개 */
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

  runnerPromise = runPausableSpeechRunner(session);
  return runnerPromise;
}
