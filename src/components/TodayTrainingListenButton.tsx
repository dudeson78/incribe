import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '../context/SettingsContext';
import type { ScheduledRow } from '../hooks/useVerses';
import {
  cancelTodayTrainingSpeech,
  getTodayTrainingSpeechStatus,
  pauseTodayTrainingSpeech,
  resumeTodayTrainingSpeech,
  speakTodayTrainingVerses,
  type TrainingSpeechStatus,
} from '../lib/todayTrainingSpeech';
import { cancelVerseCardSpeech } from '../lib/verseCardSpeech';
import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

type Props = {
  rows: ScheduledRow[];
};

export function TodayTrainingListenButton({ rows }: Props) {
  const { t } = useTranslation();
  const { speechSettings } = useSettings();
  const [status, setStatus] = useState<TrainingSpeechStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelTodayTrainingSpeech();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelTodayTrainingSpeech();
    setStatus('idle');
  }, []);

  const startSpeaking = useCallback(async () => {
    const runId = ++runIdRef.current;
    setError(null);
    cancelVerseCardSpeech();
    setStatus('playing');
    try {
      await speakTodayTrainingVerses(rows, speechSettings);
    } catch (e) {
      if (runIdRef.current === runId) {
        setError(
          e instanceof Error ? e.message : t('home.todayTrainingListenError'),
        );
      }
    } finally {
      if (runIdRef.current === runId) {
        setStatus(getTodayTrainingSpeechStatus());
      }
    }
  }, [rows, speechSettings, t]);

  async function onStartPress() {
    await startSpeaking();
  }

  async function onPausePress() {
    const ok = await pauseTodayTrainingSpeech();
    if (ok) setStatus('paused');
  }

  async function onResumePress() {
    const ok = await resumeTodayTrainingSpeech();
    if (ok) setStatus('playing');
  }

  if (rows.length === 0) return null;

  const isActive = status === 'playing' || status === 'paused';

  return (
    <View style={styles.wrap}>
      {!isActive ? (
        <Pressable
          onPress={() => void onStartPress()}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('home.todayTrainingListenA11y')}
        >
          <Ionicons name="volume-high-outline" size={40} color={colors.white} />
          <Text style={styles.btnTitle}>{t('home.todayTrainingListen')}</Text>
          <Text style={styles.btnHint}>{t('home.todayTrainingListenHint')}</Text>
        </Pressable>
      ) : (
        <View style={styles.activePanel}>
          <View style={styles.statusRow}>
            {status === 'playing' ? (
              <Ionicons name="volume-high" size={22} color={colors.forest} />
            ) : (
              <Ionicons name="pause-circle" size={22} color={colors.orange} />
            )}
            <Text style={styles.statusText}>
              {status === 'playing'
                ? t('home.todayTrainingListenPlaying')
                : t('home.todayTrainingListenPaused')}
            </Text>
          </View>

          <View style={styles.controlRow}>
            {status === 'playing' ? (
              <Pressable
                onPress={() => void onPausePress()}
                style={({ pressed }) => [
                  styles.controlBtn,
                  styles.pauseBtn,
                  pressed && styles.controlBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('home.todayTrainingListenPauseA11y')}
              >
                <Ionicons name="pause" size={28} color={colors.white} />
                <Text style={styles.controlBtnText}>
                  {t('home.todayTrainingListenPause')}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => void onResumePress()}
                style={({ pressed }) => [
                  styles.controlBtn,
                  styles.resumeBtn,
                  pressed && styles.controlBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('home.todayTrainingListenResumeA11y')}
              >
                <Ionicons name="play" size={28} color={colors.white} />
                <Text style={styles.controlBtnText}>
                  {t('home.todayTrainingListenResume')}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={stopSpeaking}
              style={({ pressed }) => [
                styles.controlBtn,
                styles.stopBtn,
                pressed && styles.controlBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('home.todayTrainingListenStopA11y')}
            >
              <Ionicons name="stop" size={26} color={colors.forest} />
              <Text style={[styles.controlBtnText, styles.stopBtnText]}>
                {t('home.todayTrainingListenStop')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.activeHint}>
            {status === 'paused'
              ? t('home.todayTrainingListenPausedHint')
              : t('home.todayTrainingListenPlayingHint')}
          </Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  btn: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 148,
    alignSelf: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.forest,
    borderWidth: 1,
    borderColor: `${colors.forest}cc`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    minHeight: touchTarget.min,
  },
  btnPressed: {
    opacity: 0.92,
  },
  btnTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  btnHint: {
    fontSize: typography.chip,
    fontWeight: '600',
    color: `${colors.white}dd`,
    textAlign: 'center',
    lineHeight: 16,
  },
  activePanel: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
    minHeight: 148,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlBtn: {
    flex: 1,
    minHeight: touchTarget.min + 8,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  controlBtnPressed: {
    opacity: 0.9,
  },
  pauseBtn: {
    backgroundColor: colors.forest,
  },
  resumeBtn: {
    backgroundColor: colors.orange,
  },
  stopBtn: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
  },
  controlBtnText: {
    fontSize: typography.chip,
    fontWeight: '700',
    color: colors.white,
  },
  stopBtnText: {
    color: colors.forest,
  },
  activeHint: {
    fontSize: typography.chip,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  error: {
    fontSize: typography.chip,
    color: colors.errorBorder,
    textAlign: 'center',
    lineHeight: 18,
  },
});
