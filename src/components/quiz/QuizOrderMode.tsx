import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../ui/AppButton';
import type { ScheduledRow } from '../../hooks/useVerses';
import {
  shuffleSegments,
  splitVerseIntoSegments,
} from '../../lib/quizTextUtils';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

type OrderItem = {
  id: string;
  text: string;
};

type Props = {
  row: ScheduledRow;
  onBack: () => void;
  embedded?: boolean;
  /** 순서 정답일 때 — 상위에서 구절 칩 완료 색 표시 */
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
            <Text style={styles.backChipTxt}>{'‹ '} {t('quiz.back')}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.dragHint}>{t('quiz.orderDragHint')}</Text>

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
                <Text style={styles.arrowTxt}>▲</Text>
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
                <Text style={styles.arrowTxt}>▼</Text>
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
        <AppButton
          label={t('quiz.orderCheck')}
          onPress={checkOrder}
          style={styles.primaryGap}
        />
      ) : null}
      <AppButton
        label={t('quiz.orderReshuffle')}
        onPress={reshuffle}
        variant="secondary"
        size="md"
      />
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
    color: colors.orange,
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
    color: colors.orange,
  },
  dragHint: {
    fontSize: typography.min,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  list: {
    gap: 8,
  },
  segmentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
    padding: 14,
    minHeight: touchTarget.min + 10,
  },
  segmentCardOk: {
    borderColor: colors.successBorder,
    borderWidth: 2,
    backgroundColor: colors.successBg,
  },
  segIx: {
    fontSize: typography.min,
    fontWeight: '800',
    color: colors.white,
    backgroundColor: colors.forest,
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
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
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
    borderRadius: radius.sm,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
    backgroundColor: colors.backgroundSecondary,
  },
  arrowBtnPressed: {
    opacity: 0.85,
    backgroundColor: `${colors.forest}14`,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  arrowTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest,
  },
  fb: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 8,
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
  },
  primaryGap: {
    marginTop: 8,
  },
});
