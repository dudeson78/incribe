import type { SpeechSettings } from '../types/speechSettings';
import {
  clearSpeechAbortFlag,
  isSpeechSpeaking,
  pauseSpeech,
  resumeSpeech,
  speakWithSettings,
  stopSpeech,
} from './speechEngine';

import { orderTodayScheduledRows, type ScheduledRow } from '../hooks/useVerses';
import { referenceToSpeech } from './referenceSpeech';

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

export type TrainingSpeechStatus = 'idle' | 'playing' | 'paused';

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

let cancelRequested = false;
let sessionStatus: TrainingSpeechStatus = 'idle';
const pauseWaiters: Array<() => void> = [];

function notifyPauseWaiters(): void {
  while (pauseWaiters.length > 0) {
    pauseWaiters.shift()?.();
  }
}

function waitWhilePaused(): Promise<void> {
  if (sessionStatus !== 'paused') return Promise.resolve();
  return new Promise((resolve) => {
    pauseWaiters.push(resolve);
  });
}

export function getTodayTrainingSpeechStatus(): TrainingSpeechStatus {
  return sessionStatus;
}

export function cancelTodayTrainingSpeech(): void {
  cancelRequested = true;
  sessionStatus = 'idle';
  clearSpeechAbortFlag();
  notifyPauseWaiters();
  stopSpeech();
}

export function isTodayTrainingSpeechCancelled(): boolean {
  return cancelRequested;
}

export async function pauseTodayTrainingSpeech(): Promise<boolean> {
  if (sessionStatus !== 'playing') return false;
  sessionStatus = 'paused';
  await pauseSpeech();
  return true;
}

export async function resumeTodayTrainingSpeech(): Promise<boolean> {
  if (sessionStatus !== 'paused') return false;
  sessionStatus = 'playing';
  clearSpeechAbortFlag();
  notifyPauseWaiters();
  await resumeSpeech();
  return true;
}

async function speakSegment(
  text: string,
  settings: SpeechSettings,
): Promise<'done' | 'cancelled'> {
  while (true) {
    if (cancelRequested) return 'cancelled';
    await waitWhilePaused();
    if (cancelRequested) return 'cancelled';

    const result = await speakWithSettings(text, settings);
    if (cancelRequested) return 'cancelled';
    if (result === 'done') return 'done';
    /* aborted — 일시정지로 중단됨, 재개 후 같은 구간부터 */
    await waitWhilePaused();
  }
}

/** 오늘 훈련구절 리스트 순서로 쉐도잉 안내 낭독 */
export async function speakTodayTrainingVerses(
  rows: ScheduledRow[],
  settings: SpeechSettings,
): Promise<void> {
  cancelRequested = false;
  sessionStatus = 'playing';
  const ordered = orderTodayScheduledRows(rows);

  try {
    if (ordered.length === 0) return;

    if ((await speakSegment(INTRO, settings)) === 'cancelled') return;

    for (let i = 0; i < ordered.length; i++) {
      const row = ordered[i]!;
      const reference = row.verse.reference?.trim() ?? '';
      const body = row.verse.text?.trim() ?? '';

      if (reference) {
        if ((await speakSegment(announceLine(i, reference), settings)) === 'cancelled') {
          return;
        }
      }

      for (let rep = 0; rep < SHADOWING_REPEATS; rep++) {
        if (body) {
          if ((await speakSegment(body, settings)) === 'cancelled') return;
        }
        if (reference) {
          if ((await speakSegment(closingLine(reference), settings)) === 'cancelled') {
            return;
          }
        }
      }
    }
  } finally {
    if (!cancelRequested && sessionStatus === 'playing') {
      sessionStatus = 'idle';
    }
    if (cancelRequested) {
      sessionStatus = 'idle';
    }
  }
}

export { isSpeechSpeaking };
