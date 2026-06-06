import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  EmptyStateIllustration,
  type EmptyIllustrationVariant,
} from './illustrations/EmptyStateIllustration';
import { FadeIn } from './ui/FadeIn';
import { colors, typography } from '../theme/colors';
import { cardPadding, cardRadius } from '../theme/layout';

type Props = {
  variant: EmptyIllustrationVariant;
  title?: string;
  body: string;
  children?: ReactNode;
};

/** 빈 상태 — 소프트 일러스트 + 문구 (+ 선택 CTA) */
export function EmptyStatePanel({ variant, title, body, children }: Props) {
  return (
    <FadeIn style={styles.wrap}>
      <EmptyStateIllustration variant={variant} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.body}>{body}</Text>
      {children ? <View style={styles.footer}>{children}</View> : null}
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: cardPadding,
    gap: 8,
    backgroundColor: colors.parchment,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: colors.creamBorder,
  },
  title: {
    fontSize: typography.refLarge,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    opacity: 0.92,
  },
  footer: {
    marginTop: 6,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
