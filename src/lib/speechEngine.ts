import * as Speech from 'expo-speech';

import type { SpeechSettings } from '../types/speechSettings';

export type SpeakResult = 'done' | 'aborted';

let intentionalAbort = false;
let speakGeneration = 0;
let pendingResolve: ((result: SpeakResult) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;
let pendingGeneration = 0;

function settlePending(result: SpeakResult): void {
  if (!pendingResolve) return;
  const resolve = pendingResolve;
  pendingResolve = null;
  pendingReject = null;
  pendingGeneration = 0;
  resolve(result);
}

function rejectPending(error: Error): void {
  if (!pendingReject) return;
  const reject = pendingReject;
  pendingResolve = null;
  pendingReject = null;
  pendingGeneration = 0;
  reject(error);
}

function bumpSpeakGeneration(): void {
  speakGeneration += 1;
}

function isStaleSpeakCallback(utteranceGen: number): boolean {
  return utteranceGen !== speakGeneration || utteranceGen !== pendingGeneration;
}

/** Web Speech 등에서 cancel 후 speaking 플래그가 잠깐 남는 경우 대비 */
export async function waitSpeechEngineIdle(maxMs = 400): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const speaking = await Speech.isSpeakingAsync();
    if (!speaking) return;
    await new Promise((r) => setTimeout(r, 40));
  }
  await Speech.stop();
  settlePending('aborted');
  bumpSpeakGeneration();
  await new Promise((r) => setTimeout(r, 60));
}

export function speakWithSettings(
  text: string,
  settings: SpeechSettings,
): Promise<SpeakResult> {
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve('done');

  return new Promise((resolve, reject) => {
    const gen = ++speakGeneration;
    pendingGeneration = gen;
    pendingResolve = resolve;
    pendingReject = reject;
    intentionalAbort = false;

    Speech.speak(trimmed, {
      language: settings.language,
      rate: settings.rate,
      pitch: settings.pitch,
      voice: settings.voiceURI ?? undefined,
      onDone: () => {
        if (isStaleSpeakCallback(gen)) return;
        if (intentionalAbort) return;
        settlePending('done');
      },
      onStopped: () => {
        if (isStaleSpeakCallback(gen)) return;
        settlePending(intentionalAbort ? 'aborted' : 'done');
      },
      onError: (error) =>
        rejectPending(error instanceof Error ? error : new Error(String(error))),
    });
  });
}

export function stopSpeech(): void {
  intentionalAbort = true;
  void Speech.stop();
  settlePending('aborted');
  bumpSpeakGeneration();
}

/** 일시정지: stop 후 대기 중인 speak Promise를 aborted로 마무리 */
export async function pauseSpeech(): Promise<void> {
  intentionalAbort = true;
  try {
    await Speech.stop();
  } catch {
    /* ignore */
  }
  settlePending('aborted');
  bumpSpeakGeneration();
  await waitSpeechEngineIdle();
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
