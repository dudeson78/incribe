import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  EmptyStateIllustration,
  type EmptyIllustrationVariant,
} from './illustrations/EmptyStateIllustration';
import { FadeIn } from './ui/FadeIn';
import { cardShadow, colors, typography } from '../theme/colors';
import { cardPadding, cardRadius } from '../theme/layout';

type Props = {
  variant: EmptyIllustrationVariant;
  title?: string;
  body: string;
  children?: ReactNode;
  /** 일러스트·문구 간격 축소 */
  compact?: boolean;
  /** 카드 테두리·배경 없이 플레인 배치 */
  plain?: boolean;
};

/** 빈 상태 — 소프트 일러스트 + 문구 (+ 선택 CTA) */
export function EmptyStatePanel({
  variant,
  title,
  body,
  children,
  compact = false,
  plain = false,
}: Props) {
  return (
    <FadeIn
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        plain && styles.wrapPlain,
      ]}
    >
      <EmptyStateIllustration variant={variant} />
      {title ? (
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {title}
        </Text>
      ) : null}
      <Text style={[styles.body, compact && styles.bodyCompact]}>{body}</Text>
      {children ? (
        <View style={[styles.footer, compact && styles.footerCompact]}>
          {children}
        </View>
      ) : null}
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
    ...cardShadow,
  },
  wrapCompact: {
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  wrapPlain: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  title: {
    fontSize: typography.refLarge,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: typography.min,
    fontWeight: '800',
  },
  body: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    opacity: 0.92,
  },
  bodyCompact: {
    fontSize: typography.caption,
    lineHeight: 20,
    opacity: 0.82,
    maxWidth: 260,
  },
  footer: {
    marginTop: 6,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  footerCompact: {
    marginTop: 10,
    maxWidth: 300,
    width: '100%',
  },
});
