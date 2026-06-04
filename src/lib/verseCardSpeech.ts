import type { SpeechSettings } from '../types/speechSettings';
import {
  speakWithSettings,
  stopSpeech,
  waitSpeechEngineIdle,
} from './speechEngine';

let runToken = 0;

export function cancelVerseCardSpeech(): void {
  runToken += 1;
  stopSpeech();
}

/** 훈련 카드 — 본문을 1회만 낭독 (일시정지 없음) */
export async function speakVerseOnce(
  text: string,
  settings: SpeechSettings,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const myToken = ++runToken;
  stopSpeech();
  await waitSpeechEngineIdle();
  if (myToken !== runToken) return;

  await speakWithSettings(trimmed, settings);
}
