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

import { QuizPrimaryButton, quizStyles } from './QuizUi';
import type { ScheduledRow } from '../../hooks/useVerses';
import { referencesMatch } from '../../lib/referenceMatch';
import { tokens } from '../../theme/tokens';

type Phase = 'input' | 'feedback';

type Props = {
  row: ScheduledRow;
  onBack?: () => void;
  embedded?: boolean;
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
  const [inputFocused, setInputFocused] = useState(false);

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
      <View style={quizStyles.verseCard}>
        <Text style={quizStyles.prompt}>
          {t('quiz.refInstructionBanner')}
        </Text>
        <Text style={quizStyles.verseText} selectable>
          “{text}”
        </Text>
      </View>

      <TextInput
        style={[
          quizStyles.answerInput,
          inputFocused && quizStyles.answerInputFocused,
        ]}
        value={answer}
        onChangeText={setAnswer}
        placeholder={t('quiz.phRef')}
        placeholderTextColor={tokens.color.textMuted}
        editable={phase === 'input'}
        autoCorrect={false}
        autoCapitalize="none"
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
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

      <QuizPrimaryButton
        label={phase === 'input' ? t('quiz.check') : t('quiz.next')}
        onPress={onNext}
        accessibilityLabel={
          phase === 'input' ? t('quiz.a11yVerify') : t('quiz.a11yNextQ')
        }
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
    paddingTop: 4,
    paddingBottom: 40,
  },
  feedback: {
    padding: 16,
    borderRadius: tokens.radius.md,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedbackOk: {
    backgroundColor: tokens.color.successBg,
    borderColor: tokens.color.success,
  },
  feedbackBad: {
    backgroundColor: tokens.color.dangerBg,
    borderColor: tokens.color.dangerBorder,
  },
  feedbackTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackTitleOk: {
    color: tokens.color.success,
  },
  feedbackTitleBad: {
    color: tokens.color.danger,
  },
  feedbackSub: {
    marginTop: 8,
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  embeddedSection: {
    paddingBottom: 8,
  },
});
