import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import { QuizPrimaryButton, quizStyles } from './QuizUi';
import type { ScheduledRow } from '../../hooks/useVerses';
import {
  shuffleSegments,
  splitVerseIntoSegments,
} from '../../lib/quizTextUtils';
import { colors, typography } from '../../theme/colors';
import { verseTypography } from '../../theme/fonts';
import { radius, touchTarget } from '../../theme/layout';
import { shadowMd, tokens } from '../../theme/tokens';

type OrderItem = {
  id: string;
  text: string;
};

function OrderChevronIcon({
  direction,
  color,
}: {
  direction: 'up' | 'down';
  color: string;
}) {
  const d =
    direction === 'up' ? 'M3 10 L8 5 L13 10' : 'M3 5 L8 10 L13 5';
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" accessibilityElementsHidden>
      <Path
        d={d}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Props = {
  row: ScheduledRow;
  onBack: () => void;
  embedded?: boolean;
  /** ?? ??? ? ? ???? ?? ? ?? ? ?? */
  onOrderSolved?: (verseId: string) => void;
};

function arraysEqualOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function buildOrderItems(segments: string[], roundKey: number): OrderItem[] {
  return segments.map((text, i) => ({
    id: `${roundKey}-${i}`,
    text,
  }));
}

export function QuizOrderMode({
  row,
  onBack,
  embedded = false,
  onOrderSolved,
}: Props) {
  const { t } = useTranslation();
  const text = row.verse.text ?? '';
  const [roundKey, setRoundKey] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'bad'>('idle');

  const correctSegments = useMemo(
    () => splitVerseIntoSegments(text),
    [text],
  );

  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const segs = splitVerseIntoSegments(text);
    setItems(buildOrderItems(shuffleSegments(segs), roundKey));
    setFeedback('idle');
  }, [text, roundKey]);

  const order = useMemo(() => items.map((item) => item.text), [items]);

  if (correctSegments.length < 2) {
    return (
      <View style={styles.pad}>
        <Text style={styles.err}>{t('quiz.orderTooShort')}</Text>
        <Pressable style={styles.ghostBtn} onPress={onBack}>
          <Text style={styles.ghostTxt}>{t('quiz.backToList')}</Text>
        </Pressable>
      </View>
    );
  }

  function moveItem(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
    setFeedback('idle');
  }

  function checkOrder() {
    const ok = arraysEqualOrder(order, correctSegments);
    setFeedback(ok ? 'ok' : 'bad');
    if (ok) {
      onOrderSolved?.(row.verse.id);
    }
  }

  function reshuffle() {
    setRoundKey((k) => k + 1);
  }

  const orderInner = (
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
            <Text style={styles.backChipTxt}>{'\u2039 '} {t('quiz.back')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.promptCard}>
        <Text style={quizStyles.prompt}>{t('quiz.orderDragHint')}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.segmentCard,
              feedback === 'ok' && styles.segmentCardOk,
            ]}
          >
            <Text style={styles.segIx}>{index + 1}</Text>
            <Text style={styles.segTxt}>{item.text}</Text>
            <View style={styles.arrowCol}>
              <Pressable
                style={({ pressed }) => [
                  styles.arrowBtn,
                  pressed && styles.arrowBtnPressed,
                  index === 0 && styles.arrowBtnDisabled,
                ]}
                onPress={() => moveItem(index, -1)}
                disabled={index === 0}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={t('quiz.orderMoveUpA11y')}
              >
                <OrderChevronIcon
                  direction="up"
                  color={
                    index === 0
                      ? tokens.color.textMuted
                      : tokens.color.textPrimary
                  }
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.arrowBtn,
                  pressed && styles.arrowBtnPressed,
                  index === items.length - 1 && styles.arrowBtnDisabled,
                ]}
                onPress={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={t('quiz.orderMoveDownA11y')}
              >
                <OrderChevronIcon
                  direction="down"
                  color={
                    index === items.length - 1
                      ? tokens.color.textMuted
                      : tokens.color.textPrimary
                  }
                />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {feedback === 'ok' ? (
        <View style={[styles.fb, styles.fbOk]}>
          <Text style={styles.fbOkTxt}>{t('quiz.orderCorrect')}</Text>
        </View>
      ) : null}
      {feedback === 'bad' ? (
        <View style={[styles.fb, styles.fbBad]}>
          <Text style={styles.fbBadTitle}>{t('quiz.orderWrong')}</Text>
          <Text style={styles.fbReveal} selectable>
            {correctSegments.join(' ')}
          </Text>
        </View>
      ) : null}

      {feedback !== 'ok' ? (
        <QuizPrimaryButton label={t('quiz.check')} onPress={checkOrder} />
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.secondaryAction,
          pressed && styles.secondaryActionPressed,
        ]}
        onPress={reshuffle}
        accessibilityRole="button"
        accessibilityLabel={t('quiz.orderReshuffle')}
      >
        <Text style={styles.secondaryActionText}>
          {t('quiz.orderReshuffle')}
        </Text>
      </Pressable>
    </>
  );

  if (embedded) {
    return (
      <View style={[styles.scroll, styles.embeddedBlock]}>{orderInner}</View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {orderInner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: {
    padding: 24,
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  embeddedBlock: {
    paddingBottom: 8,
    gap: 10,
  },
  err: {
    fontSize: typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  ghostBtn: { paddingVertical: 12 },
  ghostTxt: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  topBar: { marginBottom: 6 },
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
    color: colors.textPrimary,
  },
  promptCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 16,
    marginBottom: 12,
    alignSelf: 'stretch',
    ...shadowMd,
  },
  list: {
    gap: 8,
  },
  segmentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 12,
    minHeight: touchTarget.min + 10,
    ...shadowMd,
  },
  segmentCardOk: {
    borderColor: tokens.color.success,
    borderWidth: 2,
    backgroundColor: tokens.color.successBg,
  },
  segIx: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '800',
    color: tokens.color.textOnDark,
    backgroundColor: tokens.color.primary,
    minWidth: 26,
    textAlign: 'center',
    lineHeight: 22,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  segTxt: {
    flex: 1,
    ...verseTypography.body,
    fontSize: typography.min,
    lineHeight: 22,
  },
  arrowCol: {
    alignSelf: 'center',
    gap: 6,
    marginLeft: 2,
  },
  arrowBtn: {
    width: 32,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bgSecondary,
  },
  arrowBtnPressed: {
    opacity: 0.85,
    backgroundColor: tokens.color.primaryTint08,
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  fb: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 8,
  },
  fbOk: {
    backgroundColor: tokens.color.successBg,
    borderColor: tokens.color.success,
  },
  fbOkTxt: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fbBad: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  fbBadTitle: {
    fontWeight: '700',
    fontSize: typography.min,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  fbReveal: {
    ...verseTypography.body,
    fontSize: typography.min,
    lineHeight: 22,
  },
  secondaryAction: {
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  secondaryActionPressed: {
    opacity: 0.85,
  },
  secondaryActionText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
});
