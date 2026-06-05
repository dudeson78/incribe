import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSettings } from '../context/SettingsContext';
import { splitKeywordCsv } from '../lib/quizTextUtils';
import {
  cancelVerseCardSpeech,
  speakVerseOnce,
} from '../lib/verseCardSpeech';
import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

type VerseVerifyModalTriggerProps = {
  reference: string;
  text: string;
  keywords?: string | null;
  mnemonics?: string | null;
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

/** 암송 단계에서 본문·키워드 확인 및 말씀 듣기 */
export function VerseVerifyModalTrigger({
  reference,
  text,
  keywords,
  mnemonics,
  disabled = false,
}: VerseVerifyModalTriggerProps) {
  const { t } = useTranslation();
  const { speechSettings } = useSettings();
  const [scriptureVisible, setScriptureVisible] = useState(false);
  const [keywordVisible, setKeywordVisible] = useState(false);
  const [mnemonicsVisible, setMnemonicsVisible] = useState(false);
  const [listenStatus, setListenStatus] = useState<'idle' | 'playing'>('idle');
  const listenRunRef = useRef(0);

  const refTrimmed = typeof reference === 'string' ? reference.trim() : '';
  const body = typeof text === 'string' ? text.trim() : '';
  const mnemonicsText =
    typeof mnemonics === 'string' ? mnemonics.trim() : '';
  const keywordList = useMemo(() => splitKeywordCsv(keywords), [keywords]);

  useEffect(() => {
    if (disabled) {
      setScriptureVisible(false);
      setKeywordVisible(false);
      setMnemonicsVisible(false);
      cancelVerseCardSpeech();
      setListenStatus('idle');
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      cancelVerseCardSpeech();
    };
  }, []);

  const startVerseListen = useCallback(async () => {
    if (!body) return;
    const runId = ++listenRunRef.current;
    setListenStatus('playing');
    try {
      await speakVerseOnce(body, speechSettings);
    } finally {
      if (listenRunRef.current === runId) {
        setListenStatus('idle');
      }
    }
  }, [body, speechSettings]);

  function onListenPress() {
    if (disabled || !body) return;
    if (listenStatus === 'playing') return;
    void startVerseListen();
  }

  const listenLabel = t('seven.verifyVerseListenBtn');
  const listenA11y = t('seven.verifyVerseListenA11y');

  return (
    <>
      <View style={styles.triggerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            styles.triggerThird,
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
          <Text style={styles.triggerText} numberOfLines={1}>
            {t('seven.verifyScriptureBtn')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            styles.triggerThird,
            listenStatus !== 'idle' && styles.triggerListenActive,
            pressed && styles.triggerPressed,
            (disabled || !body) && styles.triggerDisabled,
          ]}
          onPress={onListenPress}
          disabled={disabled || !body}
          accessibilityRole="button"
          accessibilityLabel={listenA11y}
        >
          {listenStatus === 'playing' ? (
            <ActivityIndicator size="small" color={colors.forest} />
          ) : null}
          <Text
            style={[
              styles.triggerText,
              listenStatus !== 'idle' && styles.triggerTextActive,
            ]}
            numberOfLines={1}
          >
            {listenLabel}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            styles.triggerThird,
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
          <Text style={styles.triggerText} numberOfLines={1}>
            {t('seven.verifyKeywordBtn')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.trigger,
            styles.triggerThird,
            pressed && styles.triggerPressed,
            disabled && styles.triggerDisabled,
          ]}
          onPress={() => {
            if (disabled) return;
            setMnemonicsVisible(true);
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('seven.verifyMnemonicsA11y')}
        >
          <Text style={styles.triggerText} numberOfLines={1}>
            {t('seven.verifyMnemonicsBtn')}
          </Text>
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

      <VerifyModal
        visible={mnemonicsVisible}
        title={t('seven.verifyMnemonicsModalTitle', { ref: refTrimmed })}
        onClose={() => setMnemonicsVisible(false)}
      >
        {mnemonicsText.length === 0 ? (
          <Text style={styles.emptyKeywords}>
            {t('seven.verifyMnemonicsEmpty')}
          </Text>
        ) : (
          <Text style={styles.body} selectable>
            {mnemonicsText}
          </Text>
        )}
      </VerifyModal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 5,
    marginTop: 12,
  },
  trigger: {
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.forest}44`,
    backgroundColor: `${colors.forest}0d`,
    minHeight: touchTarget.min * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  triggerThird: {
    flex: 1,
  },
  triggerListenActive: {
    borderColor: colors.forest,
    backgroundColor: `${colors.forest}14`,
  },
  triggerPressed: {
    opacity: 0.88,
  },
  triggerDisabled: {
    opacity: 0.45,
  },
  triggerText: {
    fontSize: typography.chip,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
  },
  triggerTextActive: {
    fontWeight: '700',
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
