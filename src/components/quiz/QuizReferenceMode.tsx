import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../ui/AppButton';
import type { ScheduledRow } from '../../hooks/useVerses';
import { referencesMatch } from '../../lib/referenceMatch';
import { colors, typography } from '../../theme/colors';
import { verseTypography } from '../../theme/fonts';
import { cardPadding, radius } from '../../theme/layout';
import { parchmentCard } from '../../theme/surfaces';

type Phase = 'input' | 'feedback';

type Props = {
  row: ScheduledRow;
  onBack?: () => void;
  embedded?: boolean;
  /** 참조 정답일 때 — 상위에서 구절 칩 완료 색 표시 */
  onReferenceSolved?: (verseId: string) => void;
};

/** 구절 맞추기 — 선택한 오늘 훈련 구절의 본문으로 참조 입력 */
export function QuizReferenceMode({
  row,
  embedded = false,
  onReferenceSolved,
}: Props) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const text = row.verse.text ?? '';
  const reference = row.verse.reference ?? '';

  useEffect(() => {
    setAnswer('');
    setPhase('input');
    setLastCorrect(null);
  }, [row.verse.id]);

  function onNext() {
    if (phase === 'input') {
      const ok = referencesMatch(answer, reference);
      setLastCorrect(ok);
      setPhase('feedback');
      if (ok) {
        onReferenceSolved?.(row.verse.id);
      }
      return;
    }

    setAnswer('');
    setPhase('input');
    setLastCorrect(null);
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
          “{text}”
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
                ref: reference,
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
