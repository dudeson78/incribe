import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { splitKeywordCsv } from '../lib/quizTextUtils';
import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

type VerseVerifyModalTriggerProps = {
  reference: string;
  text: string;
  keywords?: string | null;
  disabled?: boolean;
};

function VerifyModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.wrap}>
        <Pressable
          style={styles.backdropHit}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('rema.modalCloseA11y')}
        />
        <View style={styles.card}>
          <Text style={styles.refTitle}>{title}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {children}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.okBtn, pressed && styles.okBtnPressed]}
            onPress={onClose}
            accessibilityLabel={t('common.ok')}
          >
            <Text style={styles.okText}>{t('common.ok')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** 암송 단계에서 본문·키워드를 확인용 모달로 표시 */
export function VerseVerifyModalTrigger({
  reference,
  text,
  keywords,
  disabled = false,
}: VerseVerifyModalTriggerProps) {
  const { t } = useTranslation();
  const [scriptureVisible, setScriptureVisible] = useState(false);
  const [keywordVisible, setKeywordVisible] = useState(false);
  const refTrimmed = typeof reference === 'string' ? reference.trim() : '';
  const body = typeof text === 'string' ? text.trim() : '';
  const keywordList = useMemo(() => splitKeywordCsv(keywords), [keywords]);

  useEffect(() => {
    if (disabled) {
      setScriptureVisible(false);
      setKeywordVisible(false);
    }
  }, [disabled]);

  return (
    <>
      <View style={styles.triggerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            styles.triggerHalf,
            pressed && styles.triggerPressed,
            disabled && styles.triggerDisabled,
          ]}
          onPress={() => {
            if (disabled) return;
            setScriptureVisible(true);
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('seven.verifyScriptureA11y')}
        >
          <Text style={styles.triggerText}>{t('seven.verifyScriptureBtn')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            styles.triggerHalf,
            pressed && styles.triggerPressed,
            disabled && styles.triggerDisabled,
          ]}
          onPress={() => {
            if (disabled) return;
            setKeywordVisible(true);
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('seven.verifyKeywordA11y')}
        >
          <Text style={styles.triggerText}>{t('seven.verifyKeywordBtn')}</Text>
        </Pressable>
      </View>

      <VerifyModal
        visible={scriptureVisible}
        title={refTrimmed}
        onClose={() => setScriptureVisible(false)}
      >
        <Text style={styles.body} selectable>
          {body}
        </Text>
      </VerifyModal>

      <VerifyModal
        visible={keywordVisible}
        title={t('seven.verifyKeywordModalTitle', { ref: refTrimmed })}
        onClose={() => setKeywordVisible(false)}
      >
        {keywordList.length === 0 ? (
          <Text style={styles.emptyKeywords}>{t('seven.verifyKeywordEmpty')}</Text>
        ) : (
          <View style={styles.keywordList}>
            {keywordList.map((kw, i) => (
              <View key={`${i}-${kw}`} style={styles.keywordChip}>
                <Text style={styles.keywordText} selectable>
                  {kw}
                </Text>
              </View>
            ))}
          </View>
        )}
      </VerifyModal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 12,
  },
  trigger: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.forest}44`,
    backgroundColor: `${colors.forest}0d`,
    minHeight: touchTarget.min * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerHalf: {
    flex: 1,
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
    textAlign: 'center',
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
  emptyKeywords: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  keywordList: {
    gap: 8,
  },
  keywordChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: `${colors.orange}12`,
    borderWidth: 1,
    borderColor: `${colors.orange}44`,
  },
  keywordText: {
    fontSize: typography.min,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
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
