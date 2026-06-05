import { useEffect, useMemo, useState } from 'react';
import {
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

import { AppButton } from '../ui/AppButton';
import type { ScheduledRow } from '../../hooks/useVerses';
import {
  buildBlankChallengePreferKeywords,
  createSeededRandom,
  normalizeQuizToken,
} from '../../lib/quizTextUtils';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

type Props = {
  row: ScheduledRow;
  /** 목록 초기화(비움)·짧은 본문일 때 에러 처리 */
  onBack: () => void;
  embedded?: boolean;
  /** 모든 빈칸 정답일 때 호출 — 상위에서 구절 칩 완료 표시 등 */
  onBlankSolved?: (verseId: string) => void;
};

export function QuizBlankMode({
  row,
  onBack,
  embedded = false,
  onBlankSolved,
}: Props) {
  const { t } = useTranslation();
  const text = row.verse.text ?? '';
  const [roundKey, setRoundKey] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'bad'>('idle');
  /** 정답 확인 시 각 빈칸별 판정 — 'ok'(맞음, 파랑) / 'bad'(틀림, 빨강) / null(미확인) */
  const [slotResults, setSlotResults] = useState<Array<'ok' | 'bad' | null>>(
    [],
  );

  const challenge = useMemo(() => {
    const keywords = row.verse.keywords ?? null;
    const hasKeywords = (keywords ?? '').trim().length > 0;
    const keywordOnly = roundKey === 0 && hasKeywords;
    return buildBlankChallengePreferKeywords(
      text,
      keywords,
      createSeededRandom(roundKey * 1_000_003 + text.length * 17),
      { keywordOnly },
    );
  }, [text, row.verse.keywords, roundKey]);

  useEffect(() => {
    if (!challenge?.blankIndices.length) return;
    setGuesses(Array(challenge.blankIndices.length).fill(''));
    setSlotResults(Array(challenge.blankIndices.length).fill(null));
    setFeedback('idle');
  }, [challenge, roundKey]);

  const blankSet = useMemo(
    () =>
      challenge ? new Set(challenge.blankIndices) : new Set<number>(),
    [challenge],
  );

  /** 토큰 인덱스 → 빈칸 슬롯 번호 */
  const slotAtToken = useMemo(() => {
    const m = new Map<number, number>();
    if (!challenge) return m;
    challenge.blankIndices.forEach((ti, si) => m.set(ti, si));
    return m;
  }, [challenge]);

  if (!challenge || challenge.blankIndices.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.err}>{t('quiz.blankTooShort')}</Text>
        <Pressable style={styles.btnGhost} onPress={onBack}>
          <Text style={styles.btnGhostTxt}>{t('quiz.backToList')}</Text>
        </Pressable>
      </View>
    );
  }

  const C = challenge;

  function setGuess(slot: number, v: string) {
    setGuesses((prev) => {
      const next = [...prev];
      next[slot] = v;
      return next;
    });
    setSlotResults((prev) => {
      if (prev[slot] == null) return prev;
      const next = [...prev];
      next[slot] = null;
      return next;
    });
    setFeedback('idle');
  }

  function verify() {
    const results = C.answers.map((ans, s) =>
      normalizeQuizToken(guesses[s] ?? '') === normalizeQuizToken(ans ?? '')
        ? ('ok' as const)
        : ('bad' as const),
    );
    setSlotResults(results);
    const ok = results.every((r) => r === 'ok');
    setFeedback(ok ? 'ok' : 'bad');
    if (ok) {
      onBlankSolved?.(row.verse.id);
    }
  }

  function reshuffleBlanks() {
    setRoundKey((k) => k + 1);
  }

  const blankChip = feedback === 'bad';

  const blankInner = (
    <>
      {!embedded ? (
        <View style={styles.topBar}>
          <Pressable
            onPress={onBack}
            style={styles.backChip}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('quiz.backToList')}
          >
            <Text style={styles.backChipTxt}>{'‹ '} {t('quiz.back')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.versePaper,
          blankChip && styles.versePaperBad,
        ]}
      >
        <View style={styles.tokenFlow}>
          {C.tokens.map((tok, ti) => {
            if (!blankSet.has(ti)) {
              return (
                <Text key={`t-${ti}`} style={styles.tokenWord}>
                  {tok}
                </Text>
              );
            }
            const si = slotAtToken.get(ti) ?? 0;
            return (
              <TextInput
                key={`b-slot-${si}-r-${roundKey}`}
                style={[
                  styles.blankInput,
                  slotResults[si] === 'ok' && styles.blankInputOk,
                  slotResults[si] === 'bad' && styles.blankInputBad,
                ]}
                value={guesses[si] ?? ''}
                onChangeText={(v) => setGuess(si, v)}
                placeholder="···"
                placeholderTextColor={`${colors.muted}88`}
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel={t('quiz.blankInputA11y', {
                  n: si + 1,
                })}
              />
            );
          })}
        </View>
      </View>

      {feedback === 'ok' ? (
        <View style={[styles.fb, styles.fbOk]}>
          <Text style={styles.fbOkTxt}>{t('quiz.blankCorrect')}</Text>
        </View>
      ) : null}
      {feedback === 'bad' ? (
        <View style={[styles.fb, styles.fbBad]}>
          <Text style={styles.fbBadTitle}>{t('quiz.blankWrong')}</Text>
          <Text style={styles.fbReveal} selectable>
            {text}
          </Text>
        </View>
      ) : null}

      {feedback !== 'ok' ? (
        <AppButton
          label={t('quiz.blankCheck')}
          onPress={verify}
          style={styles.primaryGap}
        />
      ) : null}

      <AppButton
        label={t('quiz.blankRegenerate')}
        onPress={reshuffleBlanks}
        variant="secondary"
        size="md"
      />
    </>
  );

  if (embedded) {
    return (
      <View style={[styles.scroll, styles.embeddedBlock]}>{blankInner}</View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flexKB}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {blankInner}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexKB: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  embeddedBlock: {
    paddingBottom: 8,
    gap: 12,
  },
  wrap: { padding: 24, gap: 16 },
  err: {
    fontSize: typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  topBar: { marginBottom: 4 },
  backChip: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  backChipTxt: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.orange,
  },
  versePaper: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.creamBorder,
    padding: 16,
  },
  versePaperBad: {
    borderColor: colors.errorBorder,
  },
  tokenFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    rowGap: 12,
  },
  tokenWord: {
    fontSize: typography.body,
    lineHeight: 28,
    color: colors.textPrimary,
    marginRight: 2,
  },
  blankInput: {
    minWidth: 80,
    maxWidth: 160,
    borderBottomWidth: 2,
    borderBottomColor: colors.forest,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: `${colors.white}aa`,
    borderRadius: radius.sm,
  },
  blankInputOk: {
    borderBottomColor: colors.pastelBlueBorder,
    backgroundColor: colors.pastelBlueBg,
  },
  blankInputBad: {
    borderBottomColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
  },
  fb: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fbOk: {
    backgroundColor: colors.pastelBlueBg,
    borderColor: colors.pastelBlueBorder,
  },
  fbOkTxt: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.pastelBlueText,
    textAlign: 'center',
  },
  fbBad: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  fbBadTitle: {
    fontWeight: '700',
    fontSize: typography.min,
    color: colors.errorBorder,
    marginBottom: 6,
  },
  fbReveal: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  primaryGap: {
    marginTop: 4,
  },
  btnGhost: {
    padding: 14,
    alignItems: 'center',
  },
  btnGhostTxt: {
    fontSize: typography.body,
    color: colors.orange,
    fontWeight: '700',
  },
});
