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

import type { ScheduledRow } from '../../hooks/useVerses';
import {
  buildBlankChallenge,
  normalizeQuizToken,
} from '../../lib/quizTextUtils';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

type Props = {
  row: ScheduledRow;
  onBack: () => void;
};

export function QuizBlankMode({ row, onBack }: Props) {
  const { t } = useTranslation();
  const text = row.verse.text ?? '';
  const [roundKey, setRoundKey] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'bad'>('idle');

  const challenge = useMemo(() => buildBlankChallenge(text), [text, roundKey]);

  useEffect(() => {
    if (!challenge?.blankIndices.length) return;
    setGuesses(Array(challenge.blankIndices.length).fill(''));
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
    setFeedback('idle');
  }

  function verify() {
    let ok = true;
    for (let s = 0; s < C.answers.length; s++) {
      if (
        normalizeQuizToken(guesses[s] ?? '') !==
        normalizeQuizToken(C.answers[s] ?? '')
      ) {
        ok = false;
        break;
      }
    }
    setFeedback(ok ? 'ok' : 'bad');
  }

  function reshuffleBlanks() {
    setRoundKey((k) => k + 1);
  }

  const blankChip = feedback === 'bad';

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
          <Text style={styles.refBadge} numberOfLines={2}>
            {row.verse.reference}
          </Text>
        </View>

        <Text style={styles.hint}>{t('quiz.blankHint')}</Text>

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
                    feedback === 'ok' && styles.blankInputOk,
                    feedback === 'bad' && styles.blankInputBad,
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

        <Pressable style={styles.btnPri} onPress={verify}>
          <Text style={styles.btnPriTxt}>{t('quiz.blankCheck')}</Text>
        </Pressable>

        <Pressable style={styles.btnSec} onPress={reshuffleBlanks}>
          <Text style={styles.btnSecTxt}>{t('quiz.blankRegenerate')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexKB: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  wrap: { padding: 24, gap: 16 },
  err: {
    fontSize: typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  topBar: { gap: 10, marginBottom: 4 },
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
  refBadge: {
    fontSize: typography.refLarge,
    fontWeight: '800',
    color: colors.forest,
    lineHeight: 28,
  },
  hint: {
    fontSize: typography.min,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 4,
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
    borderRadius: 6,
  },
  blankInputOk: {
    borderBottomColor: colors.successBorder,
    backgroundColor: colors.successBg,
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
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  fbOkTxt: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.successBorder,
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
    fontStyle: 'italic',
  },
  btnPri: {
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    minHeight: touchTarget.min,
  },
  btnPriTxt: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  btnSec: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundSecondary,
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  btnSecTxt: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
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
