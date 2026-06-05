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

type RemaModalTriggerProps = {
  rema: string | null | undefined;
  /** 세션 종료 확인 Modal 등 진행 표시 중일 때 레마 모달 닫기·열기 차단 */
  interactionLocked?: boolean;
};

/** 레마는 기본 숨김 — 탭 시 모달로 전체 표시 */
export function RemaModalTrigger({
  rema,
  interactionLocked = false,
}: RemaModalTriggerProps) {
  const { t } = useTranslation();
  const trimmed = typeof rema === 'string' ? rema.trim() : '';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (interactionLocked) setVisible(false);
  }, [interactionLocked]);

  if (!trimmed) return null;

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          pressed && !interactionLocked && styles.triggerPressed,
          interactionLocked && styles.triggerDisabled,
        ]}
        onPress={() => {
          if (interactionLocked) return;
          setVisible(true);
        }}
        disabled={interactionLocked}
        accessibilityRole="button"
        accessibilityLabel={t('rema.viewAction')}
      >
        <Text style={styles.triggerText}>{t('rema.viewAction')}</Text>
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
            <Text style={styles.title}>{t('rema.label')}</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              <Text style={styles.body} selectable>
                {trimmed}
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
    backgroundColor: colors.overlayBackdrop,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    gap: 14,
    maxHeight: '78%',
    zIndex: 1,
  },
  title: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 320,
  },
  scrollContent: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  body: {
    fontSize: typography.ref,
    lineHeight: 26,
    color: colors.textPrimary,
    fontStyle: 'italic',
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
