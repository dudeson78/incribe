import * as Speech from 'expo-speech';

import type { SpeechSettings } from '../types/speechSettings';

export type SpeakResult = 'done' | 'aborted';

let intentionalAbort = false;

export function speakWithSettings(
  text: string,
  settings: SpeechSettings,
): Promise<SpeakResult> {
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve('done');

  return new Promise((resolve, reject) => {
    Speech.speak(trimmed, {
      language: settings.language,
      rate: settings.rate,
      pitch: settings.pitch,
      voice: settings.voiceURI ?? undefined,
      onDone: () => resolve('done'),
      onStopped: () => {
        resolve(intentionalAbort ? 'aborted' : 'done');
      },
      onError: (error) => reject(error),
    });
  });
}

export function stopSpeech(): void {
  intentionalAbort = false;
  void Speech.stop();
}

/** 일시정지: 모든 플랫폼에서 stop 후 재개 시 같은 구간부터 다시 읽음 */
export async function pauseSpeech(): Promise<void> {
  intentionalAbort = true;
  void Speech.stop();
}

export async function resumeSpeech(): Promise<void> {
  intentionalAbort = false;
}

export async function isSpeechSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

export function clearSpeechAbortFlag(): void {
  intentionalAbort = false;
}
