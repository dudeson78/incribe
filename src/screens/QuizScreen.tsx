import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppScreenTitle } from '../components/navigation/AppScreenTitle';
import { QuizBlankMode } from '../components/quiz/QuizBlankMode';
import {
  QuizModeSelector,
  type QuizSurfaceMode,
} from '../components/quiz/QuizModeSelector';
import { QuizOrderMode } from '../components/quiz/QuizOrderMode';
import { QuizReferenceMode } from '../components/quiz/QuizReferenceMode';
import { QuizTodayVerseList } from '../components/quiz/QuizTodayVerseList';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useVerses, type ScheduledRow } from '../hooks/useVerses';
import { colors, typography } from '../theme/colors';
import { screenPadding } from '../theme/layout';

export function QuizScreen() {
  const tabScrollPadding = useBottomTabScrollPadding(24);
  const { t } = useTranslation();
  const { getScheduledToday } = useVerses();
  const [mode, setMode] = useState<QuizSurfaceMode>('reference');
  const [todayRows, setTodayRows] = useState<ScheduledRow[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [playRow, setPlayRow] = useState<ScheduledRow | null>(null);
  const [referenceSolvedIds, setReferenceSolvedIds] = useState(
    () => new Set<string>(),
  );
  const [blankSolvedIds, setBlankSolvedIds] = useState(() => new Set<string>());
  const [orderSolvedIds, setOrderSolvedIds] = useState(() => new Set<string>());

  /** 세 모드 공통 — 홈에서 오늘 훈련 완료한 구절만 */
  const quizVerseRows = useMemo(
    () => todayRows.filter((r) => r.todaySessionRecordedSuccess ?? false),
    [todayRows],
  );

  const solvedVerseSet = useMemo(() => {
    if (mode === 'reference') return referenceSolvedIds;
    if (mode === 'blank') return blankSolvedIds;
    if (mode === 'order') return orderSolvedIds;
    return null;
  }, [mode, referenceSolvedIds, blankSolvedIds, orderSolvedIds]);

  const loadToday = useCallback(async () => {
    setTodayLoading(true);
    try {
      const rows = await getScheduledToday();
      setTodayRows(rows);
      const trainedRows = rows.filter(
        (r) => r.todaySessionRecordedSuccess ?? false,
      );
      setPlayRow((prev) => {
        if (trainedRows.length === 0) return null;
        if (prev && trainedRows.some((r) => r.verse.id === prev.verse.id)) {
          return prev;
        }
        return null;
      });
    } catch {
      setTodayRows([]);
      setPlayRow(null);
    } finally {
      setTodayLoading(false);
    }
  }, [getScheduledToday]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  function onModeChange(next: QuizSurfaceMode) {
    setMode(next);
    setPlayRow(null);
  }

  const onReferenceSolved = useCallback((verseId: string) => {
    setReferenceSolvedIds((prev) => {
      if (prev.has(verseId)) return prev;
      const next = new Set(prev);
      next.add(verseId);
      return next;
    });
  }, []);

  const onBlankSolved = useCallback((verseId: string) => {
    setBlankSolvedIds((prev) => {
      if (prev.has(verseId)) return prev;
      const next = new Set(prev);
      next.add(verseId);
      return next;
    });
  }, []);

  const onOrderSolved = useCallback((verseId: string) => {
    setOrderSolvedIds((prev) => {
      if (prev.has(verseId)) return prev;
      const next = new Set(prev);
      next.add(verseId);
      return next;
    });
  }, []);

  function clearDailyPlaySelection() {
    setPlayRow(null);
  }

  const playRowInList =
    playRow != null &&
    quizVerseRows.some((r) => r.verse.id === playRow.verse.id);

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <AppScreenTitle title={t('quiz.screenTitle')} />
      <KeyboardAvoidingView
        style={styles.keyboardShell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollOuter}
          contentContainerStyle={[
            styles.scrollOuterContent,
            { paddingBottom: tabScrollPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <QuizModeSelector
            active={mode}
            onChange={onModeChange}
            labels={{
              reference: t('quiz.modeReference'),
              blank: t('quiz.modeBlank'),
              order: t('quiz.modeOrder'),
            }}
          />

          {todayLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.forest} />
              <Text style={styles.loaderTxt}>{t('quiz.loadingToday')}</Text>
            </View>
          ) : (
            <QuizTodayVerseList
              rows={quizVerseRows}
              loading={false}
              embedded
              compactChipRow
              selectedVerseId={playRow?.verse.id ?? null}
              solvedVerseIds={solvedVerseSet}
              onPick={setPlayRow}
            />
          )}

          {!todayLoading && playRow && playRowInList && mode === 'reference' ? (
            <QuizReferenceMode
              embedded
              row={playRow}
              onBack={clearDailyPlaySelection}
              onReferenceSolved={onReferenceSolved}
            />
          ) : null}
          {!todayLoading && playRow && playRowInList && mode === 'blank' ? (
            <QuizBlankMode
              embedded
              row={playRow}
              onBack={clearDailyPlaySelection}
              onBlankSolved={onBlankSolved}
            />
          ) : null}
          {!todayLoading && playRow && playRowInList && mode === 'order' ? (
            <QuizOrderMode
              embedded
              row={playRow}
              onBack={clearDailyPlaySelection}
              onOrderSolved={onOrderSolved}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardShell: {
    flex: 1,
  },
  scrollOuter: {
    flexGrow: 1,
  },
  scrollOuterContent: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
  },
  loader: {
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 40,
  },
  loaderTxt: {
    fontSize: typography.min,
    color: colors.textPrimary,
  },
});
