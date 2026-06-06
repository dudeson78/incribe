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
  /** 빈칸·순서 모드에서 한 번 이상 맞춘 오늘 훈련 구절 id (칩 색 표시) */
  const [blankSolvedIds, setBlankSolvedIds] = useState(() => new Set<string>());
  const [orderSolvedIds, setOrderSolvedIds] = useState(() => new Set<string>());

  const solvedVerseSet = useMemo(() => {
    if (mode === 'blank') return blankSolvedIds;
    if (mode === 'order') return orderSolvedIds;
    return null;
  }, [mode, blankSolvedIds, orderSolvedIds]);

  const loadToday = useCallback(async () => {
    setTodayLoading(true);
    try {
      const rows = await getScheduledToday();
      setTodayRows(rows);
      /** 로드 완료 시에만 초기 선택(뒤로/오류 해제 후에는 사용자가 목록만 볼 수 있도록 자동 재선택 안 함) */
      if (mode === 'blank' || mode === 'order') {
        setPlayRow((prev) => {
          if (rows.length === 0) return null;
          if (prev && rows.some((r) => r.verse.id === prev.verse.id)) {
            return prev;
          }
          return null;
        });
      }
    } catch {
      setTodayRows([]);
      if (mode === 'blank' || mode === 'order') {
        setPlayRow(null);
      }
    } finally {
      setTodayLoading(false);
    }
  }, [getScheduledToday, mode]);

  useEffect(() => {
    if (mode === 'blank' || mode === 'order') {
      void loadToday();
    }
  }, [mode, loadToday]);

  function onModeChange(next: QuizSurfaceMode) {
    setMode(next);
    setPlayRow(null);
  }

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

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
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
          {mode === 'reference' ? (
            <QuizReferenceMode embedded />
          ) : (
            <>
              {todayLoading ? (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" color={colors.forest} />
                  <Text style={styles.loaderTxt}>{t('quiz.loadingToday')}</Text>
                </View>
              ) : (
                <QuizTodayVerseList
                  rows={todayRows}
                  loading={false}
                  embedded
                  compactChipRow
                  selectedVerseId={playRow?.verse.id ?? null}
                  solvedVerseIds={solvedVerseSet}
                  onPick={setPlayRow}
                />
              )}
              {!todayLoading &&
              playRow &&
              mode === 'blank' &&
              todayRows.some((r) => r.verse.id === playRow.verse.id) ? (
                <QuizBlankMode
                  embedded
                  row={playRow}
                  onBack={clearDailyPlaySelection}
                  onBlankSolved={onBlankSolved}
                />
              ) : null}
              {!todayLoading &&
              playRow &&
              mode === 'order' &&
              todayRows.some((r) => r.verse.id === playRow.verse.id) ? (
                <QuizOrderMode
                  embedded
                  row={playRow}
                  onBack={clearDailyPlaySelection}
                  onOrderSolved={onOrderSolved}
                />
              ) : null}
            </>
          )}
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
