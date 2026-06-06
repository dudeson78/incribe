import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyStatePanel } from '../EmptyStatePanel';
import { AppButton } from '../ui/AppButton';
import { useVerses } from '../../hooks/useVerses';
import { referencesMatch } from '../../lib/referenceMatch';
import type { VerseWithSchedule } from '../../types/verses';
import { colors, typography } from '../../theme/colors';
import { verseTypography } from '../../theme/fonts';
import { cardPadding, radius } from '../../theme/layout';
import { parchmentCard } from '../../theme/surfaces';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

type Phase = 'input' | 'feedback';

/** 구절 맞추기 (약어 참조 입력) · `embedded`면 상위 스크롤에 붙임 */
export function QuizReferenceMode({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const { getAllVerses } = useVerses();
  const [pool, setPool] = useState<VerseWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllVerses();
      const active = rows.filter((r) => r.is_active);
      setPool(shuffle(active));
      setIndex(0);
      setAnswer('');
      setPhase('input');
      setLastCorrect(null);
    } catch {
      setPool([]);
    } finally {
      setLoading(false);
    }
  }, [getAllVerses]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = pool[index];

  function onNext() {
    if (!current || pool.length === 0) return;

    if (phase === 'input') {
      const ok = referencesMatch(answer, current.reference);
      setLastCorrect(ok);
      setPhase('feedback');
      return;
    }

    const nextI = (index + 1) % pool.length;
    setIndex(nextI);
    setAnswer('');
    setPhase('input');
    setLastCorrect(null);
  }

  if (loading) {
    return (
      <View style={[styles.loader, embedded && styles.embeddedSection]}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text style={styles.loaderTxt}>{t('quiz.loadingVerses')}</Text>
      </View>
    );
  }

  if (!current || pool.length === 0) {
    return (
      <View style={[styles.emptyWrap, embedded && styles.embeddedSection]}>
        <EmptyStatePanel
          variant="quiz"
          title={t('quiz.emptyTitle')}
          body={t('quiz.emptyBody')}
        />
      </View>
    );
  }

  const body = (
    <>
      <View style={styles.instructionBox}>
        <Text style={styles.instructionBoxText}>
          {t('quiz.refInstructionBanner')}
        </Text>
      </View>

      <View style={styles.verseCard}>
        <Text style={styles.quizVerse} selectable>
          “{current.text}”
        </Text>
      </View>

      <TextInput
        style={styles.answerInput}
        value={answer}
        onChangeText={setAnswer}
        placeholder={t('quiz.phRef')}
        placeholderTextColor={`${colors.muted}99`}
        editable={phase === 'input'}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={t('quiz.a11yRefInput')}
      />

      {phase === 'feedback' && lastCorrect !== null ? (
        <View
          style={[
            styles.feedback,
            lastCorrect ? styles.feedbackOk : styles.feedbackBad,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text
            style={[
              styles.feedbackTitle,
              lastCorrect ? styles.feedbackTitleOk : styles.feedbackTitleBad,
            ]}
          >
            {lastCorrect ? t('quiz.correct') : t('quiz.wrong')}
          </Text>
          {!lastCorrect ? (
            <Text style={styles.feedbackSub}>
              {t('quiz.answerLine', {
                label: t('quiz.answerLabel'),
                ref: current.reference,
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <AppButton
        label={phase === 'input' ? t('quiz.check') : t('quiz.next')}
        onPress={onNext}
        accessibilityLabel={
          phase === 'input' ? t('quiz.a11yVerify') : t('quiz.a11yNextQ')
        }
        style={styles.primaryGap}
      />
    </>
  );

  if (embedded) {
    return (
      <View style={[styles.scroll, styles.embeddedSection]}>{body}</View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {body}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderTxt: {
    fontSize: typography.min,
    color: colors.textPrimary,
  },
  emptyWrap: {
    padding: 8,
    alignItems: 'stretch',
  },
  instructionBox: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    alignItems: 'center',
  },
  instructionBoxText: {
    fontSize: typography.min,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  verseCard: {
    ...parchmentCard,
    marginBottom: 16,
    alignItems: 'center',
    padding: cardPadding,
  },
  quizVerse: {
    ...verseTypography.bodyLarge,
    textAlign: 'center',
  },
  answerInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.forest,
    marginBottom: 12,
    textAlign: 'center',
  },
  feedback: {
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackOk: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  feedbackBad: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  feedbackTitle: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  feedbackTitleOk: {
    color: colors.textPrimary,
  },
  feedbackTitleBad: {
    color: colors.textPrimary,
  },
  feedbackSub: {
    marginTop: 8,
    fontSize: typography.min,
    color: colors.textPrimary,
  },
  primaryGap: {
    marginBottom: 8,
  },
  embeddedSection: {
    paddingBottom: 8,
  },
});
