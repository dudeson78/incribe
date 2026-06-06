import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreenTitle } from '../components/navigation/AppScreenTitle';
import { EmptyStatePanel } from '../components/EmptyStatePanel';
import { AppButton } from '../components/ui/AppButton';
import { AnnualGoalCard } from '../components/AnnualGoalCard';
import { HomeGroupedReview } from '../components/HomeGroupedReview';
import { TodayPracticeVerseBadge } from '../components/TodayPracticeVerseBadge';
import { TodaysReviewList } from '../components/TodaysReviewList';
import {
  useVerses,
  orderTodayScheduledRows,
  sortScheduledForMemorizeOrder,
  type DashboardSummary,
  type ScheduledRow,
} from '../hooks/useVerses';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { mapAppError } from '../i18n/mapAppError';
import type { RootTabParamList } from '../navigation/tabParams';
import { useSettings } from '../context/SettingsContext';
import type { VerseWithSchedule } from '../types/verses';
import { colors, typography } from '../theme/colors';
import { radius, screenPadding } from '../theme/layout';
import { useTranslation } from 'react-i18next';

export function HomeScreen() {
  const tabScrollPadding = useBottomTabScrollPadding(20);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { annualGoal, loaded: settingsLoaded } = useSettings();
  const goalTarget = settingsLoaded ? annualGoal : 52;

  const {
    getScheduledToday,
    getDashboardSummary,
    getAllVerses,
    logReview,
    completeLongRemediation,
  } = useVerses();
  const [scheduled, setScheduled] = useState<ScheduledRow[]>([]);
  const [savedVerses, setSavedVerses] = useState<VerseWithSchedule[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 그룹 목록에서 선택한 구절을 바로 아래 훈련 카드에서 먼저 연습 */
  const [trainingFocusVerseId, setTrainingFocusVerseId] = useState<
    string | null
  >(null);
  const scrollRef = useRef<ScrollView>(null);
  const trainingAnchorYRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await getScheduledToday();
      setScheduled(rows);
      const dash = await getDashboardSummary(goalTarget, rows);
      setSummary(dash);
    } catch (e) {
      setError(mapAppError(e, t));
      setScheduled([]);
      setSummary(null);
    }

    try {
      const all = await getAllVerses();
      setSavedVerses(all.filter((v) => v.is_active));
    } catch {
      setSavedVerses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAllVerses, getDashboardSummary, getScheduledToday, goalTarget, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  async function onTrainingLogged() {
    setTrainingFocusVerseId(null);
    await load();
  }

  const dash: DashboardSummary =
    summary ??
    ({
      goalTarget,
      versesThisYear: 0,
      doneToday: 0,
      dueToday: 0,
    } satisfies DashboardSummary);

  const pendingSessions = useMemo(
    () =>
      scheduled.filter((r) => !(r.todaySessionRecordedSuccess ?? false)),
    [scheduled],
  );

  const trainingEmptyCaption = useMemo(() => {
    if (scheduled.length === 0 || pendingSessions.length > 0) return undefined;
    return t('memorize.allSessionsDoneForToday');
  }, [pendingSessions.length, scheduled.length, t]);

  const homeTrainingOrderVerseIds = useMemo(
    () =>
      scheduled.length === 0
        ? ([] as string[])
        : orderTodayScheduledRows(scheduled).map((r) => r.verse.id),
    [scheduled],
  );

  const itemsForTraining = useMemo(() => {
    const base = sortScheduledForMemorizeOrder(pendingSessions);
    if (!trainingFocusVerseId) return base;
    const ix = base.findIndex((r) => r.verse.id === trainingFocusVerseId);
    if (ix <= 0) return base;
    const picked = base[ix]!;
    return [picked, ...base.slice(0, ix), ...base.slice(ix + 1)];
  }, [pendingSessions, trainingFocusVerseId]);

  useLayoutEffect(() => {
    if (!trainingFocusVerseId) return;
    const scrollToCard = (): boolean => {
      const y = trainingAnchorYRef.current;
      if (y == null || scrollRef.current == null) return false;
      scrollRef.current.scrollTo({
        y: Math.max(0, y - 12),
        animated: true,
      });
      return true;
    };
    if (!scrollToCard()) {
      const id = requestAnimationFrame(() => {
        void scrollToCard();
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [trainingFocusVerseId]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppScreenTitle title={t('home.screenTitle')} />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabScrollPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.forest}
            colors={[colors.forest]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{t('home.loadError')}</Text>
            <Text style={styles.bannerBody}>
              {error}
              {'\n'}
              {t('home.loadErrorHint')}
            </Text>
          </View>
        ) : null}

        <AnnualGoalCard
          goalTarget={dash.goalTarget}
          versesThisYear={dash.versesThisYear}
        />

        {!loading && !error ? <TodayPracticeVerseBadge /> : null}

        {!loading && !error && savedVerses.length === 0 ? (
          <View style={styles.emptyBelowTrainingBadge}>
            <EmptyStatePanel
              variant="seedling"
              body={t('home.emptyVersesHint', { tab: t('tabs.verses') })}
            >
              <AppButton
                label={t('home.emptyVersesCta', { tab: t('tabs.verses') })}
                onPress={() => navigation.navigate('VersesTab')}
                size="md"
                accessibilityLabel={t('home.emptyVersesCta', {
                  tab: t('tabs.verses'),
                })}
              />
            </EmptyStatePanel>
          </View>
        ) : null}

        {!loading && !error && scheduled.length > 0 ? (
          <>
            <HomeGroupedReview
              items={scheduled}
              onSelectVerse={(verseId) => {
                const hit = scheduled.find((r) => r.verse.id === verseId);
                if (!hit || (hit.todaySessionRecordedSuccess ?? false)) return;
                setTrainingFocusVerseId(verseId);
              }}
            />
          </>
        ) : null}

        {!error && (loading || savedVerses.length > 0) ? (
          <View
            collapsable={false}
            onLayout={(e) => {
              trainingAnchorYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <TodaysReviewList
              key={
                trainingFocusVerseId
                  ? `focus-${trainingFocusVerseId}`
                  : 'today-queue'
              }
              items={itemsForTraining}
              loading={loading}
              plannedSessionTotal={scheduled.length}
              homeTrainingOrderVerseIds={
                homeTrainingOrderVerseIds.length > 0
                  ? homeTrainingOrderVerseIds
                  : undefined
              }
              logReview={logReview}
              completeLongRemediation={completeLongRemediation}
              alternateEmptyCaption={trainingEmptyCaption}
              onLogged={() => void onTrainingLogged()}
            />
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: screenPadding,
    paddingTop: screenPadding,
    flexGrow: 1,
  },
  banner: {
    backgroundColor: colors.orangeTint,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.orangeTintBorder,
  },
  bannerTitle: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  bannerBody: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.textPrimary,
    opacity: 0.92,
  },
  emptyBelowTrainingBadge: {
    marginTop: 12,
  },
});
