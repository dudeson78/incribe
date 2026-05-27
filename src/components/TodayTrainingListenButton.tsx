import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type { ScheduledRow } from '../hooks/useVerses';
import {
  cancelTodayTrainingSpeech,
  isSpeechSpeaking,
  speakTodayTrainingVerses,
} from '../lib/todayTrainingSpeech';
import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

type Props = {
  rows: ScheduledRow[];
};

export function TodayTrainingListenButton({ rows }: Props) {
  const { t } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelTodayTrainingSpeech();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelTodayTrainingSpeech();
    setSpeaking(false);
  }, []);

  const startSpeaking = useCallback(async () => {
    const runId = ++runIdRef.current;
    setError(null);
    setSpeaking(true);
    try {
      await speakTodayTrainingVerses(rows);
    } catch (e) {
      if (runIdRef.current === runId) {
        setError(
          e instanceof Error ? e.message : t('home.todayTrainingListenError'),
        );
      }
    } finally {
      if (runIdRef.current === runId) {
        const still = await isSpeechSpeaking();
        if (!still) setSpeaking(false);
      }
    }
  }, [rows, t]);

  async function onPress() {
    if (speaking) {
      stopSpeaking();
      return;
    }
    await startSpeaking();
  }

  if (rows.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => void onPress()}
        style={({ pressed }) => [
          styles.btn,
          speaking && styles.btnActive,
          pressed && styles.btnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          speaking
            ? t('home.todayTrainingListenStopA11y')
            : t('home.todayTrainingListenA11y')
        }
      >
        {speaking ? (
          <ActivityIndicator size="large" color={colors.white} />
        ) : (
          <Ionicons name="volume-high-outline" size={40} color={colors.white} />
        )}
        <Text style={styles.btnTitle}>
          {speaking
            ? t('home.todayTrainingListenStop')
            : t('home.todayTrainingListen')}
        </Text>
        <Text style={styles.btnHint}>
          {speaking
            ? t('home.todayTrainingListenStopHint')
            : t('home.todayTrainingListenHint')}
        </Text>
      </Pressable>
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
  btnActive: {
    backgroundColor: `${colors.forest}dd`,
    borderColor: colors.orange,
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
  error: {
    fontSize: typography.chip,
    color: colors.errorBorder,
    textAlign: 'center',
    lineHeight: 18,
  },
});
