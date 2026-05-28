import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ScheduledRow } from '../../hooks/useVerses';
import {
  shuffleSegments,
  splitVerseIntoSegments,
} from '../../lib/quizTextUtils';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';
import {
  QuizOrderDragList,
  type OrderDragItem,
} from './QuizOrderDragList';

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

function buildOrderItems(segments: string[], roundKey: number): OrderDragItem[] {
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

  const [items, setItems] = useState<OrderDragItem[]>([]);

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

  function onReorder(next: OrderDragItem[]) {
    setItems(next);
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

      <QuizOrderDragList
        items={items}
        onReorder={onReorder}
        dragA11yLabel={t('quiz.orderDragHandleA11y')}
        renderCard={(item, index, dragging) => (
          <View
            style={[
              styles.segmentCard,
              dragging && styles.segmentCardDragging,
              feedback === 'ok' && styles.segmentCardOk,
            ]}
          >
            <Text style={styles.segIx}>{index + 1}</Text>
            <Text style={styles.segTxt}>{item.text}</Text>
          </View>
        )}
      />

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

      <Pressable style={styles.btnPri} onPress={checkOrder}>
        <Text style={styles.btnPriTxt}>{t('quiz.orderCheck')}</Text>
      </Pressable>
      <Pressable style={styles.btnSec} onPress={reshuffle}>
        <Text style={styles.btnSecTxt}>{t('quiz.orderReshuffle')}</Text>
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
  segmentCardDragging: {
    borderColor: colors.forest,
    borderWidth: 1.5,
    backgroundColor: `${colors.forest}08`,
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
    borderRadius: 8,
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
  btnPri: {
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
});
