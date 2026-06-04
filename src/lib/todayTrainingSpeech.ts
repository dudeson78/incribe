import type { SpeechSettings } from '../types/speechSettings';
import {
  beginPausableSpeechSession,
  cancelPausableSpeechSession,
  getPausableSpeechStatus,
  pausePausableSpeechSession,
  resumePausableSpeechSession,
  runPausableSpeechSegments,
  type PausableSpeechSession,
  type PausableSpeechStatus,
} from './pausableSpeech';
import { isSpeechSpeaking } from './speechEngine';

import { orderTodayScheduledRows, type ScheduledRow } from '../hooks/useVerses';
import { referenceToSpeech } from './referenceSpeech';

const SESSION_ID = 'today-training';

const INTRO =
  '오늘 훈련구절을 알려드립니다. 총 세번 반복되니 큰 소리로 쉐도잉 해 주세요.';

const SHADOWING_REPEATS = 3;

const ORDINAL_PREFIX = [
  '첫',
  '두',
  '세',
  '네',
  '다섯',
  '여섯',
  '일곱',
  '여덟',
  '아홉',
  '열',
] as const;

export type TrainingSpeechStatus = PausableSpeechStatus;

let session: PausableSpeechSession | null = null;

function ordinalSpeech(n: number): string {
  if (n >= 1 && n <= ORDINAL_PREFIX.length) {
    return `${ORDINAL_PREFIX[n - 1]}번째`;
  }
  return `${n}번째`;
}

function announceLine(index: number, reference: string): string {
  const refSpeech = referenceToSpeech(reference);
  return `${ordinalSpeech(index + 1)} 말씀은 ${refSpeech}입니다`;
}

function closingLine(reference: string): string {
  return `${referenceToSpeech(reference)} 말씀`;
}

export function getTodayTrainingSpeechStatus(): TrainingSpeechStatus {
  return getPausableSpeechStatus(SESSION_ID);
}

export function cancelTodayTrainingSpeech(): void {
  if (session) {
    cancelPausableSpeechSession(session);
    session = null;
  } else {
    cancelPausableSpeechSession(beginPausableSpeechSession(SESSION_ID));
  }
}

export function isTodayTrainingSpeechCancelled(): boolean {
  return session?.cancelRequested ?? false;
}

export async function pauseTodayTrainingSpeech(): Promise<boolean> {
  if (!session) return false;
  return pausePausableSpeechSession(session);
}

export async function resumeTodayTrainingSpeech(): Promise<boolean> {
  if (!session) return false;
  return resumePausableSpeechSession(session);
}

/** 오늘 훈련구절 리스트 순서로 쉐도잉 안내 낭독 */
export async function speakTodayTrainingVerses(
  rows: ScheduledRow[],
  settings: SpeechSettings,
): Promise<void> {
  const s = beginPausableSpeechSession(SESSION_ID);
  session = s;

  const ordered = orderTodayScheduledRows(rows);
  if (ordered.length === 0) return;

  const segments: string[] = [INTRO];

  for (let i = 0; i < ordered.length; i++) {
    const row = ordered[i]!;
    const reference = row.verse.reference?.trim() ?? '';
    const body = row.verse.text?.trim() ?? '';

    if (reference) {
      segments.push(announceLine(i, reference));
    }

    for (let rep = 0; rep < SHADOWING_REPEATS; rep++) {
      if (body) segments.push(body);
      if (reference) segments.push(closingLine(reference));
    }
  }

  await runPausableSpeechSegments(segments, settings, s);
}

export { isSpeechSpeaking };
