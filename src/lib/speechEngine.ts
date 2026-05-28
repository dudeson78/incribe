import { Platform } from 'react-native';
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

/** 현재 문장 중단(일시정지용). Android는 stop 후 같은 구간을 다시 읽는다 */
export async function pauseSpeech(): Promise<void> {
  intentionalAbort = true;
  if (Platform.OS === 'android') {
    void Speech.stop();
    return;
  }
  try {
    await Speech.pause();
  } catch {
    void Speech.stop();
  }
}

export async function resumeSpeech(): Promise<void> {
  intentionalAbort = false;
  if (Platform.OS === 'android') return;
  try {
    await Speech.resume();
  } catch {
    /* Android 등 미지원 — 호출측에서 같은 구간 재생 */
  }
}

export async function isSpeechSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

export function clearSpeechAbortFlag(): void {
  intentionalAbort = false;
}
