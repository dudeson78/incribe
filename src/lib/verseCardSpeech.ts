import {
  beginPausableSpeechSession,
  cancelPausableSpeechSession,
  getPausableSpeechStatus,
  pausePausableSpeechSession,
  resumePausableSpeechSession,
  runPausableSpeechSegments,
  type PausableSpeechStatus,
} from './pausableSpeech';
import type { SpeechSettings } from '../types/speechSettings';

const SESSION_ID = 'verse-card';
const VERSE_READ_REPEATS = 3;

let session: ReturnType<typeof beginPausableSpeechSession> | null = null;

function ensureSession() {
  if (!session || session.id !== SESSION_ID) {
    session = beginPausableSpeechSession(SESSION_ID);
  }
  return session;
}

export function getVerseCardSpeechStatus(): PausableSpeechStatus {
  return getPausableSpeechStatus(SESSION_ID);
}

export function cancelVerseCardSpeech(): void {
  if (session) {
    cancelPausableSpeechSession(session);
    session = null;
  }
}

export async function pauseVerseCardSpeech(): Promise<boolean> {
  return pausePausableSpeechSession(ensureSession());
}

export async function resumeVerseCardSpeech(): Promise<boolean> {
  return resumePausableSpeechSession(ensureSession());
}

/** 훈련 카드 — 본문만 3회 낭독 (일시정지·이어듣기만) */
export async function speakVerseTextThreeTimes(
  text: string,
  settings: SpeechSettings,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const s = beginPausableSpeechSession(SESSION_ID);
  session = s;
  const segments = Array.from({ length: VERSE_READ_REPEATS }, () => trimmed);
  await runPausableSpeechSegments(segments, settings, s);
}
