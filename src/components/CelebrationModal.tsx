import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

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
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={dismiss}
    >
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
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && styles.btnPressed,
                  busy && styles.btnDisabled,
                ]}
                onPress={() => void onConfirmShortDaily?.()}
                disabled={busy}
                accessibilityLabel={t('common.ok')}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnText}>{t('common.ok')}</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {variant === 'longAssessment' ? (
            <>
              <Text style={styles.emoji} accessible={false}>
                📅
              </Text>
              <Text style={styles.title}>{t('celebration.longTitle')}</Text>
              <Text style={styles.sub}>{t('celebration.longSubtitle')}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && styles.btnPressed,
                  busy && styles.btnDisabled,
                ]}
                onPress={() => void onConfirmLongPass?.()}
                disabled={busy}
                accessibilityLabel={t('celebration.longPassA11y')}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnText}>{t('celebration.longPass')}</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btnDangerOutline,
                  pressed && styles.btnPressed,
                  busy && styles.btnDisabled,
                ]}
                onPress={() => void onConfirmLongFail?.()}
                disabled={busy}
                accessibilityLabel={t('celebration.longFailA11y')}
              >
                <Text style={styles.btnDangerText}>{t('celebration.longFail')}</Text>
              </Pressable>
            </>
          ) : null}

          {variant === 'longRemedialComplete' ? (
            <>
              <Text style={styles.emoji}>✓</Text>
              <Text style={styles.title}>{t('celebration.remedialTitle')}</Text>
              <Text style={styles.sub}>{t('celebration.remedialSubtitle')}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && styles.btnPressed,
                  busy && styles.btnDisabled,
                ]}
                onPress={() => void onConfirmRemedial?.()}
                disabled={busy}
                accessibilityLabel={t('celebration.remedialAckA11y')}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnText}>{t('celebration.remedialAck')}</Text>
                )}
              </Pressable>
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
    </Modal>
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
    backgroundColor: 'rgba(45, 90, 61, 0.45)',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.orange,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
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
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 2,
  },
  sub: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  btnPrimary: {
    backgroundColor: colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.lg,
    minWidth: 200,
    width: '100%',
    maxWidth: 300,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerOutline: {
    borderWidth: 2,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.lg,
    minWidth: 200,
    width: '100%',
    maxWidth: 300,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
  btnDangerText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.errorBorder,
    textAlign: 'center',
  },
  linkBtn: {
    marginTop: 4,
    padding: 8,
  },
  linkText: {
    fontSize: typography.min,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
