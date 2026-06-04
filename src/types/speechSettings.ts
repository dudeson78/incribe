export type SpeechSettings = {
  /** Web Speech `voiceURI` / expo-speech `voice` identifier */
  voiceURI: string | null;
  /** IETF BCP 47 language tag */
  language: string;
  /** 1.0 = normal */
  rate: number;
  /** 1.0 = normal */
  pitch: number;
};

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  voiceURI: null,
  language: 'ko-KR',
  rate: 0.95,
  pitch: 1,
};

export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 1.5;
export const SPEECH_PITCH_MIN = 0.5;
export const SPEECH_PITCH_MAX = 1.5;

export type SpeechVoiceCategory = 'male' | 'female' | 'child' | 'unknown';

export type SpeechVoiceOption = {
  id: string;
  name: string;
  language: string;
  isDefault?: boolean;
  category?: SpeechVoiceCategory;
};

export type SpeechVoiceCategoryFilter = 'all' | SpeechVoiceCategory;
