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

import { useVerses } from '../../hooks/useVerses';
import { referencesMatch } from '../../lib/referenceMatch';
import type { VerseWithSchedule } from '../../types/verses';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildHint(reference: string, level: number): string {
  const t = reference.trim();
  if (level <= 0 || !t) return '';
  if (level === 1) return `${t.slice(0, 1)}···`;
  if (level === 2) {
    const n = Math.min(4, t.length);
    return `${t.slice(0, n)}···`;
  }
  return t;
}

type Phase = 'input' | 'feedback';

/** 성경 참조 맞히기 퀴즈 (무작위 활성 구절 풀) · `embedded`면 상위 스크롤에 붙임 */
export function QuizReferenceMode({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const { getAllVerses } = useVerses();
  const [pool, setPool] = useState<VerseWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [phase, setPhase] = useState<Phase>('input');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllVerses();
      const active = rows.filter((r) => r.is_active);
      setPool(shuffle(active));
      setIndex(0);
      setAnswer('');
      setHintLevel(0);
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
  const accuracyPct =
    attemptCount === 0 ? 0 : Math.round((correctCount / attemptCount) * 100);

  const hintText =
    current && hintLevel > 0 ? buildHint(current.reference, hintLevel) : '';

  function onHint() {
    if (!current || phase !== 'input') return;
    setHintLevel((h) => Math.min(h + 1, 3));
  }

  function onNext() {
    if (!current || pool.length === 0) return;

    if (phase === 'input') {
      const ok = referencesMatch(answer, current.reference);
      setLastCorrect(ok);
      setAttemptCount((n) => n + 1);
      setCorrectCount((c) => c + (ok ? 1 : 0));
      setPhase('feedback');
      return;
    }

    const nextI = (index + 1) % pool.length;
    setIndex(nextI);
    setAnswer('');
    setHintLevel(0);
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
      <View style={[styles.emptyBox, embedded && styles.embeddedSection]}>
        <Text style={styles.emptyTitle}>{t('quiz.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('quiz.emptyBody')}</Text>
      </View>
    );
  }

  const body = (
    <>
        <View style={styles.scoreRow}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreNum}>{correctCount}</Text>
            <Text style={styles.scoreLbl}>{t('quiz.correctCount')}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreNum}>{accuracyPct}%</Text>
            <Text style={styles.scoreLbl}>{t('quiz.accuracy')}</Text>
          </View>
        </View>

        <View style={styles.quizVerse}>
          <Text style={styles.quizVerseItal} selectable>
            “{current.text}”
          </Text>
          <Text style={styles.quizHint}>{t('quiz.refPromptShort')}</Text>
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

        {hintText ? (
          <View style={styles.hintBanner}>
            <Text style={styles.hintLabel}>{t('quiz.hint')}</Text>
            <Text style={styles.hintText}>{hintText}</Text>
          </View>
        ) : null}

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

        <Pressable
          style={({ pressed }) => [
            styles.btnPrimaryFull,
            pressed && styles.pressed,
          ]}
          onPress={onNext}
          accessibilityLabel={
            phase === 'input' ? t('quiz.a11yVerify') : t('quiz.a11yNextQ')
          }
        >
          <Text style={styles.btnPrimaryFullText}>
            {phase === 'input' ? t('quiz.check') : t('quiz.next')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondaryFull,
            pressed && styles.pressed,
            (phase !== 'input' || hintLevel >= 3) && styles.btnDisabled,
          ]}
          onPress={onHint}
          disabled={phase !== 'input' || hintLevel >= 3}
        >
          <Text style={styles.btnSecondaryFullText}>{t('quiz.hintBtn')}</Text>
        </Pressable>
        <Text style={styles.statsLine}>
          {t('quiz.stats', {
            correct: correctCount,
            total: attemptCount,
          })}
        </Text>
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
    color: colors.textSecondary,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.textPrimary,
    opacity: 0.9,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.forest,
  },
  scoreLbl: {
    marginTop: 2,
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quizVerse: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.creamBorder,
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
  },
  quizVerseItal: {
    fontSize: typography.body,
    lineHeight: 30,
    color: colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  quizHint: {
    fontSize: 13,
    color: colors.textSecondary,
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
  hintBanner: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: `${colors.orange}18`,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: `${colors.orange}55`,
  },
  hintLabel: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 4,
  },
  hintText: {
    fontSize: typography.min,
    color: colors.muted,
  },
  feedback: {
    padding: 16,
    borderRadius: 12,
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
    color: colors.successBorder,
  },
  feedbackTitleBad: {
    color: colors.errorBorder,
  },
  feedbackSub: {
    marginTop: 8,
    fontSize: typography.min,
    color: colors.muted,
  },
  btnPrimaryFull: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest,
    marginBottom: 8,
    minHeight: touchTarget.min,
  },
  btnPrimaryFullText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.white,
  },
  btnSecondaryFull: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    marginBottom: 16,
    minHeight: touchTarget.min,
  },
  btnSecondaryFullText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statsLine: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  embeddedSection: {
    paddingBottom: 8,
  },
});
