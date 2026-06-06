import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from './ui/AppButton';
import { FadeModal } from './ui/FadeModal';
import { colors, typography } from '../theme/colors';
import { cardPadding, cardRadius } from '../theme/layout';

export type CelebrationVariant =
  | 'shortDailyComplete'
  | 'longAssessment'
  | 'longRemedialComplete';

export type CelebrationModalProps = {
  visible: boolean;
  variant?: CelebrationVariant;
  busy?: boolean;
  onDismiss?: () => void;
  /** 단기 7회 축하 모달 본문(다음 일정 안내 등). 미주입 시 celebration.subtitle */
  subtitleOverride?: string | null;
  /** 단기(일 간격 트랙) 7회 후 → 복습 성공 로그 */
  onConfirmShortDaily?: () => void;
  /** 장기 검사: 오늘 복습이 충족됨을 기록 → 간격 증가 */
  onConfirmLongPass?: () => void;
  /** 장기 검사: 미달 → 교정 세션으로 전환 (실패 로그) */
  onConfirmLongFail?: () => void;
  /** 교정 세션 종료 후 다음 장기 검사 일정 확인 */
  onConfirmRemedial?: () => void;
};

export function CelebrationModal({
  visible,
  variant = 'shortDailyComplete',
  busy = false,
  onDismiss,
  subtitleOverride,
  onConfirmShortDaily,
  onConfirmLongPass,
  onConfirmLongFail,
  onConfirmRemedial,
}: CelebrationModalProps) {
  const { t } = useTranslation();

  function dismiss() {
    if (busy) return;
    onDismiss?.();
  }

  return (
    <FadeModal visible={visible} onRequestClose={dismiss}>
      <View style={styles.wrap}>
        <Pressable
          style={styles.backdropHit}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel={t('celebration.closeA11y')}
        />
        <View style={styles.card}>
          {variant === 'shortDailyComplete' ? (
            <>
              <Text
                style={styles.emoji}
                accessibilityLabel={t('celebration.congratsA11y')}
              >
                ✨
              </Text>
              <Text style={styles.title}>{t('celebration.title')}</Text>
              <Text style={styles.sub}>
                {subtitleOverride?.trim()
                  ? subtitleOverride.trim()
                  : t('celebration.subtitle')}
              </Text>
              <AppButton
                label={t('common.ok')}
                onPress={() => void onConfirmShortDaily?.()}
                variant="accent"
                loading={busy}
                style={styles.modalBtn}
                accessibilityLabel={t('common.ok')}
              />
            </>
          ) : null}

          {variant === 'longAssessment' ? (
            <>
              <Text style={styles.emoji} accessible={false}>
                📅
              </Text>
              <Text style={styles.title}>{t('celebration.longTitle')}</Text>
              <Text style={styles.sub}>{t('celebration.longSubtitle')}</Text>
              <AppButton
                label={t('celebration.longPass')}
                onPress={() => void onConfirmLongPass?.()}
                variant="accent"
                loading={busy}
                style={styles.modalBtn}
                accessibilityLabel={t('celebration.longPassA11y')}
              />
              <AppButton
                label={t('celebration.longFail')}
                onPress={() => void onConfirmLongFail?.()}
                variant="danger"
                disabled={busy}
                style={styles.modalBtn}
                accessibilityLabel={t('celebration.longFailA11y')}
              />
            </>
          ) : null}

          {variant === 'longRemedialComplete' ? (
            <>
              <Text style={styles.emoji}>✓</Text>
              <Text style={styles.title}>{t('celebration.remedialTitle')}</Text>
              <Text style={styles.sub}>{t('celebration.remedialSubtitle')}</Text>
              <AppButton
                label={t('celebration.remedialAck')}
                onPress={() => void onConfirmRemedial?.()}
                variant="accent"
                loading={busy}
                style={styles.modalBtn}
                accessibilityLabel={t('celebration.remedialAckA11y')}
              />
            </>
          ) : null}

          {onDismiss && variant !== 'shortDailyComplete' ? (
            <Pressable
              onPress={dismiss}
              disabled={busy}
              style={styles.linkBtn}
              accessibilityLabel={t('celebration.dismissA11y')}
            >
              <Text style={styles.linkText}>{t('celebration.later')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </FadeModal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backdropHit: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBackdrop,
  },
  card: {
    backgroundColor: colors.parchment,
    borderRadius: cardRadius,
    padding: cardPadding,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    gap: 8,
    zIndex: 1,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  emoji: {
    fontSize: 46,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  sub: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  modalBtn: {
    minWidth: 200,
    maxWidth: 300,
    alignSelf: 'center',
  },
  linkBtn: {
    marginTop: 4,
    padding: 8,
  },
  linkText: {
    fontSize: typography.min,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
});
