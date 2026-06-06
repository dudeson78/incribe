import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSettings } from '../context/SettingsContext';
import { splitKeywordCsv } from '../lib/quizTextUtils';
import {
  cancelVerseCardSpeech,
  speakVerseOnce,
} from '../lib/verseCardSpeech';
import { toSpeakableReference } from '../lib/speakableReference';
import { AppButton } from './ui/AppButton';
import { FadeModal } from './ui/FadeModal';
import { colors, typography } from '../theme/colors';
import { modalTheme } from '../theme/modal';
import { radius, touchTarget } from '../theme/layout';

type VerseVerifyModalTriggerProps = {
  reference: string;
  text: string;
  keywords?: string | null;
  mnemonics?: string | null;
  rema?: string | null;
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
    <FadeModal visible={visible} onRequestClose={onClose}>
      <View style={modalTheme.shell}>
        <Pressable
          style={modalTheme.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('rema.modalCloseA11y')}
        />
        <View style={modalTheme.card}>
          <Text style={modalTheme.ref}>{title}</Text>
          <ScrollView
            style={modalTheme.scroll}
            contentContainerStyle={modalTheme.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {children}
          </ScrollView>
          <AppButton
            label={t('common.ok')}
            onPress={onClose}
            size="md"
            accessibilityLabel={t('common.ok')}
          />
        </View>
      </View>
    </FadeModal>
  );
}

/** 암송 단계에서 본문·키워드 확인 및 말씀 듣기 */
export function VerseVerifyModalTrigger({
  reference,
  text,
  keywords,
  mnemonics,
  rema,
  disabled = false,
}: VerseVerifyModalTriggerProps) {
  const { t } = useTranslation();
  const { speechSettings } = useSettings();
  const [scriptureVisible, setScriptureVisible] = useState(false);
  const [keywordVisible, setKeywordVisible] = useState(false);
  const [mnemonicsVisible, setMnemonicsVisible] = useState(false);
  const [remaVisible, setRemaVisible] = useState(false);
  const [listenStatus, setListenStatus] = useState<'idle' | 'playing'>('idle');
  const listenRunRef = useRef(0);

  const refTrimmed = typeof reference === 'string' ? reference.trim() : '';
  const body = typeof text === 'string' ? text.trim() : '';
  const mnemonicsText =
    typeof mnemonics === 'string' ? mnemonics.trim() : '';
  const remaText = typeof rema === 'string' ? rema.trim() : '';
  const keywordList = useMemo(() => splitKeywordCsv(keywords), [keywords]);

  useEffect(() => {
    if (disabled) {
      setScriptureVisible(false);
      setKeywordVisible(false);
      setMnemonicsVisible(false);
      setRemaVisible(false);
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
      // 본문을 먼저 읽고, 마지막에 참조를 풀어서(잠 1:1 → 잠언 1장 1절) 읽는다.
      const spokenRef = toSpeakableReference(refTrimmed);
      const speakText = spokenRef ? `${body}. ${spokenRef}` : body;
      await speakVerseOnce(speakText, speechSettings);
    } finally {
      if (listenRunRef.current === runId) {
        setListenStatus('idle');
      }
    }
  }, [body, refTrimmed, speechSettings]);

  function onListenPress() {
    if (disabled || !body) return;
    if (listenStatus === 'playing') {
      // 재생 중 다시 누르면 중지하고 최초 상태로. runId를 올려 진행 중 러너의 finally가 상태를 덮어쓰지 않게 한다.
      listenRunRef.current += 1;
      cancelVerseCardSpeech();
      setListenStatus('idle');
      return;
    }
    void startVerseListen();
  }

  const isListening = listenStatus === 'playing';
  const listenLabel = isListening
    ? t('seven.verifyVerseListenStopBtn')
    : t('seven.verifyVerseListenBtn');
  const listenA11y = isListening
    ? t('seven.verifyVerseListenStopA11y')
    : t('seven.verifyVerseListenA11y');

  return (
    <>
      <View style={styles.triggerWrap}>
        <View style={styles.triggerPrimaryRow}>
          <AppButton
            label={t('seven.verifyScriptureBtn')}
            onPress={() => {
              if (disabled) return;
              setScriptureVisible(true);
            }}
            variant="secondary"
            size="lg"
            fullWidth={false}
            disabled={disabled}
            style={styles.primaryBtn}
            accessibilityLabel={t('seven.verifyScriptureA11y')}
          />
          <AppButton
            label={listenLabel}
            onPress={onListenPress}
            variant={isListening ? 'accent' : 'primary'}
            size="lg"
            fullWidth={false}
            disabled={disabled || !body}
            style={styles.primaryBtn}
            accessibilityLabel={listenA11y}
          />
        </View>

        <View style={styles.triggerAidRow}>
            <Pressable
              style={({ pressed }) => [
                styles.trigger,
                styles.triggerAidThird,
                styles.triggerAid,
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
              <Text style={[styles.triggerText, styles.triggerTextAid]} numberOfLines={1}>
                {t('seven.verifyKeywordBtn')}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.trigger,
                styles.triggerAidThird,
                styles.triggerAid,
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
              <Text style={[styles.triggerText, styles.triggerTextAid]} numberOfLines={1}>
                {t('seven.verifyMnemonicsBtn')}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.trigger,
                styles.triggerAidThird,
                styles.triggerAid,
                pressed && styles.triggerPressed,
                disabled && styles.triggerDisabled,
              ]}
              onPress={() => {
                if (disabled) return;
                setRemaVisible(true);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('seven.verifyRemaA11y')}
            >
              <Text style={[styles.triggerText, styles.triggerTextAid]} numberOfLines={1}>
                {t('seven.verifyRemaBtn')}
              </Text>
            </Pressable>
        </View>
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

      <VerifyModal
        visible={remaVisible}
        title={t('seven.verifyRemaModalTitle', { ref: refTrimmed })}
        onClose={() => setRemaVisible(false)}
      >
        {remaText.length === 0 ? (
          <Text style={styles.emptyKeywords}>
            {t('seven.verifyRemaEmpty')}
          </Text>
        ) : (
          <Text style={styles.body} selectable>
            {remaText}
          </Text>
        )}
      </VerifyModal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    marginTop: 12,
    gap: 8,
  },
  triggerPrimaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    minWidth: 0,
  },
  triggerAidRow: {
    flexDirection: 'row',
    gap: 6,
  },
  trigger: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: touchTarget.min * 0.72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerAidThird: {
    flex: 1,
    minWidth: 0,
  },
  /** 암기 보조 — 말씀확인·말씀듣기 아래 작은 3버튼 */
  triggerAid: {
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundSecondary,
  },
  triggerPressed: {
    opacity: 0.88,
  },
  triggerDisabled: {
    opacity: 0.45,
  },
  triggerText: {
    fontSize: typography.chip,
    lineHeight: 15,
    textAlign: 'center',
  },
  triggerTextAid: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    ...modalTheme.body,
  },
  emptyKeywords: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
