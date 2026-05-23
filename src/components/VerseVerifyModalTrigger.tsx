import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

type VerseVerifyModalTriggerProps = {
  reference: string;
  text: string;
  disabled?: boolean;
};

/** 암송 단계에서 본문·참조를 확인용으로만 모달 표시 */
export function VerseVerifyModalTrigger({
  reference,
  text,
  disabled = false,
}: VerseVerifyModalTriggerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const refTrimmed = typeof reference === 'string' ? reference.trim() : '';
  const body = typeof text === 'string' ? text.trim() : '';

  /** 암송 7회 완료 후 축하 Modal이 위에 올 때, 이 확인 창이 열린 채로 남아 터치를 가로채는 것을 방지 */
  useEffect(() => {
    if (disabled) setVisible(false);
  }, [disabled]);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => {
          if (disabled) return;
          setVisible(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t('seven.verifyScriptureA11y')}
      >
        <Text style={styles.triggerText}>{t('seven.verifyScriptureBtn')}</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.wrap}>
          <Pressable
            style={styles.backdropHit}
            onPress={() => setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t('rema.modalCloseA11y')}
          />
          <View style={styles.card}>
            <Text style={styles.refTitle}>{refTrimmed}</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              <Text style={styles.body} selectable>
                {body}
              </Text>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.okBtn, pressed && styles.okBtnPressed]}
              onPress={() => setVisible(false)}
              accessibilityLabel={t('common.ok')}
            >
              <Text style={styles.okText}>{t('common.ok')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  /** RemaModalTrigger.trigger 와 동일 */
  trigger: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.forest}44`,
    backgroundColor: `${colors.forest}0d`,
    minHeight: touchTarget.min * 0.75,
    justifyContent: 'center',
  },
  triggerPressed: {
    opacity: 0.88,
  },
  triggerDisabled: {
    opacity: 0.45,
  },
  triggerText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.forest,
  },
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  backdropHit: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 90, 61, 0.45)',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    gap: 14,
    maxHeight: '78%',
    zIndex: 1,
  },
  refTitle: {
    fontSize: typography.refLarge,
    fontWeight: '700',
    color: colors.forest,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 340,
  },
  scrollContent: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  body: {
    fontSize: typography.ref,
    lineHeight: 28,
    color: colors.textPrimary,
    fontWeight: '400',
    textAlign: 'left',
  },
  okBtn: {
    alignSelf: 'stretch',
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtnPressed: {
    opacity: 0.92,
  },
  okText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
});
