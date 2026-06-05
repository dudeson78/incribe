import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from './ui/AppButton';
import { FadeModal } from './ui/FadeModal';
import { colors, typography } from '../theme/colors';
import { modalTheme } from '../theme/modal';
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

      <FadeModal
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={modalTheme.shell}>
          <Pressable
            style={modalTheme.backdrop}
            onPress={() => setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t('rema.modalCloseA11y')}
          />
          <View style={modalTheme.card}>
            <Text style={modalTheme.title}>{t('rema.label')}</Text>
            <ScrollView
              style={modalTheme.scroll}
              contentContainerStyle={modalTheme.scrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              <Text style={modalTheme.bodyItalic} selectable>
                {trimmed}
              </Text>
            </ScrollView>
            <AppButton
              label={t('common.ok')}
              onPress={() => setVisible(false)}
              size="md"
              accessibilityLabel={t('common.ok')}
            />
          </View>
        </View>
      </FadeModal>
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
    borderColor: colors.forestTintBorder,
    backgroundColor: colors.forestTint,
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
});
