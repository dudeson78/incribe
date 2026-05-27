import * as Speech from 'expo-speech';

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

export function cancelTodayTrainingSpeech(): void {
  cancelRequested = true;
  void Speech.stop();
}

export function isTodayTrainingSpeechCancelled(): boolean {
  return cancelRequested;
}

function speakAsync(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || cancelRequested) return Promise.resolve();

  return new Promise((resolve, reject) => {
    Speech.speak(trimmed, {
      language: 'ko-KR',
      rate: 0.95,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (error) => {
        reject(error);
      },
    });
  });
}

/** 오늘 훈련구절 리스트 순서로 쉐도잉 안내 낭독 */
export async function speakTodayTrainingVerses(
  rows: ScheduledRow[],
): Promise<void> {
  cancelRequested = false;
  const ordered = orderTodayScheduledRows(rows);

  if (ordered.length === 0) return;

  await speakAsync(INTRO);
  if (cancelRequested) return;

  for (let i = 0; i < ordered.length; i++) {
    const row = ordered[i]!;
    const reference = row.verse.reference?.trim() ?? '';
    const body = row.verse.text?.trim() ?? '';

    if (reference) {
      await speakAsync(announceLine(i, reference));
      if (cancelRequested) return;
    }

    for (let rep = 0; rep < SHADOWING_REPEATS; rep++) {
      if (body) {
        await speakAsync(body);
        if (cancelRequested) return;
      }
      if (reference) {
        await speakAsync(closingLine(reference));
        if (cancelRequested) return;
      }
    }
  }
}

export async function isSpeechSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
