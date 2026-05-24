import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../components/AppHeader';
import { QuizBlankMode } from '../components/quiz/QuizBlankMode';
import {
  QuizModeSelector,
  type QuizSurfaceMode,
} from '../components/quiz/QuizModeSelector';
import { QuizOrderMode } from '../components/quiz/QuizOrderMode';
import { QuizReferenceMode } from '../components/quiz/QuizReferenceMode';
import { QuizTodayVerseList } from '../components/quiz/QuizTodayVerseList';
import { useVerses, type ScheduledRow } from '../hooks/useVerses';
import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

export function QuizScreen() {
  const { t } = useTranslation();
  const { getScheduledToday } = useVerses();
  const [mode, setMode] = useState<QuizSurfaceMode>('reference');
  const [todayRows, setTodayRows] = useState<ScheduledRow[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [playRow, setPlayRow] = useState<ScheduledRow | null>(null);

  const loadToday = useCallback(async () => {
    setTodayLoading(true);
    try {
      const rows = await getScheduledToday();
      setTodayRows(rows);
    } catch {
      setTodayRows([]);
    } finally {
      setTodayLoading(false);
    }
  }, [getScheduledToday]);

  useEffect(() => {
    if (mode === 'blank' || mode === 'order') {
      void loadToday();
    }
  }, [mode, loadToday]);

  function onModeChange(next: QuizSurfaceMode) {
    setMode(next);
    setPlayRow(null);
  }

  const modeDesc =
    mode === 'reference'
      ? t('quiz.modeDescReference')
      : mode === 'blank'
        ? t('quiz.modeDescBlank')
        : t('quiz.modeDescOrder');

  return (
    <View style={styles.shell}>
      <AppHeader />
      <QuizModeSelector
        active={mode}
        onChange={onModeChange}
        labels={{
          reference: t('quiz.modeReference'),
          blank: t('quiz.modeBlank'),
          order: t('quiz.modeOrder'),
        }}
      />
      <View style={styles.descCard}>
        <Text style={styles.descText}>{modeDesc}</Text>
      </View>

      <View style={styles.body}>
        {mode === 'reference' ? (
          <QuizReferenceMode />
        ) : playRow ? (
          mode === 'blank' ? (
            <QuizBlankMode row={playRow} onBack={() => setPlayRow(null)} />
          ) : (
            <QuizOrderMode row={playRow} onBack={() => setPlayRow(null)} />
          )
        ) : todayLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.forest} />
            <Text style={styles.loaderTxt}>{t('quiz.loadingToday')}</Text>
          </View>
        ) : (
          <QuizTodayVerseList
            rows={todayRows}
            loading={false}
            onPick={setPlayRow}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  descCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
  },
  descText: {
    fontSize: typography.min,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 40,
  },
  loaderTxt: {
    fontSize: typography.min,
    color: colors.textSecondary,
  },
});
