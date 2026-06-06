import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

import {
  SettingsSecondaryButton,
  settingsStyles,
} from './settings/SettingsUi';
import { useSettings } from '../context/SettingsContext';
import {
  isSpeechSpeaking,
  speakWithSettings,
  stopSpeech,
} from '../lib/speechEngine';
import {
  filterSpeechVoices,
  loadSpeechVoiceOptions,
} from '../lib/speechVoices';
import {
  SPEECH_PITCH_MAX,
  SPEECH_PITCH_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  type SpeechVoiceOption,
} from '../types/speechSettings';
import { colors } from '../theme/colors';
import { cardPadding, cardRadius, radius, touchTarget } from '../theme/layout';
import { shadowSm, tokens } from '../theme/tokens';

function formatSliderValue(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '');
}

export function VoiceReadingSettings() {
  const { t } = useTranslation();
  const {
    speechSettings,
    patchSpeechSettings,
    resetSpeechSettings,
    loaded,
  } = useSettings();

  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [voicePickerVisible, setVoicePickerVisible] = useState(false);
  const [draftRate, setDraftRate] = useState(speechSettings.rate);
  const [draftPitch, setDraftPitch] = useState(speechSettings.pitch);
  const previewRunRef = useRef(0);

  useEffect(() => {
    setDraftRate(speechSettings.rate);
    setDraftPitch(speechSettings.pitch);
  }, [speechSettings.rate, speechSettings.pitch]);

  const loadVoices = useCallback(async () => {
    setVoicesLoading(true);
    try {
      const list = await loadSpeechVoiceOptions();
      setVoices(list);
    } finally {
      setVoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void loadVoices();
  }, [loaded, loadVoices]);

  const filteredVoices = useMemo(
    () => filterSpeechVoices(voices, voiceQuery, 'all'),
    [voices, voiceQuery],
  );

  function voiceCategoryBadge(category: SpeechVoiceOption['category']): string {
    if (!category || category === 'unknown') {
      return t('settings.speechVoiceCategory.unknown');
    }
    return t(`settings.speechVoiceCategory.${category}`);
  }

  const selectedVoice = useMemo(
    () => voices.find((v) => v.id === speechSettings.voiceURI) ?? null,
    [speechSettings.voiceURI, voices],
  );

  function selectVoice(voice: SpeechVoiceOption | null) {
    patchSpeechSettings({
      voiceURI: voice?.id ?? null,
      language: voice?.language ?? speechSettings.language,
    });
    setVoicePickerVisible(false);
  }

  const currentVoiceLabel = selectedVoice
    ? selectedVoice.name
    : t('settings.speechVoiceSystem');

  function commitRate(value: number) {
    setDraftRate(value);
    patchSpeechSettings({ rate: value });
  }

  function commitPitch(value: number) {
    setDraftPitch(value);
    patchSpeechSettings({ pitch: value });
  }

  function handleReset() {
    resetSpeechSettings();
  }

  async function previewSpeech() {
    const runId = ++previewRunRef.current;
    stopSpeech();
    setPreviewing(true);
    try {
      await speakWithSettings(t('settings.speechPreviewSample'), {
        ...speechSettings,
        rate: draftRate,
        pitch: draftPitch,
      });
    } finally {
      if (previewRunRef.current === runId) {
        const still = await isSpeechSpeaking();
        if (!still) setPreviewing(false);
      }
    }
  }

  function stopPreview() {
    previewRunRef.current += 1;
    stopSpeech();
    setPreviewing(false);
  }

  return (
    <View style={settingsStyles.card}>
      <Text style={settingsStyles.sectionTitle}>
        {t('settings.speechSection')}
      </Text>
      <Text style={styles.speechSubtitle}>{t('settings.speechHint')}</Text>

      <Text style={styles.voiceFieldLabel}>{t('settings.speechVoice')}</Text>
      <Pressable
        style={({ pressed }) => [
          settingsStyles.voiceSelect,
          pressed && styles.voiceSelectPressed,
        ]}
        onPress={() => setVoicePickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('settings.speechVoicePickA11y')}
      >
        <Text style={settingsStyles.voiceSelectText} numberOfLines={1}>
          {currentVoiceLabel}
        </Text>
        <Text style={settingsStyles.voiceSelectChevron}>▾</Text>
      </Pressable>

      <View style={settingsStyles.controlGroup}>
        <View style={settingsStyles.sliderLabelRow}>
          <Text style={settingsStyles.controlLabel}>
            {t('settings.speechRate')}
          </Text>
          <Text style={settingsStyles.sliderValue}>
            {formatSliderValue(draftRate)}
          </Text>
        </View>
        <Slider
          style={settingsStyles.slider}
          minimumValue={SPEECH_RATE_MIN}
          maximumValue={SPEECH_RATE_MAX}
          step={0.05}
          value={draftRate}
          onValueChange={setDraftRate}
          onSlidingComplete={commitRate}
          minimumTrackTintColor={tokens.color.primary}
          maximumTrackTintColor={tokens.color.border}
          thumbTintColor={tokens.color.primary}
          accessibilityLabel={t('settings.speechRateA11y')}
        />
        <View style={settingsStyles.sliderEnds}>
          <Text style={settingsStyles.sliderEndText}>
            {t('settings.speechRateSlow')}
          </Text>
          <Text style={settingsStyles.sliderEndText}>
            {t('settings.speechRateFast')}
          </Text>
        </View>
      </View>

      <View style={settingsStyles.controlGroup}>
        <View style={settingsStyles.sliderLabelRow}>
          <Text style={settingsStyles.controlLabel}>
            {t('settings.speechPitch')}
          </Text>
          <Text style={settingsStyles.sliderValue}>
            {formatSliderValue(draftPitch)}
          </Text>
        </View>
        <Slider
          style={settingsStyles.slider}
          minimumValue={SPEECH_PITCH_MIN}
          maximumValue={SPEECH_PITCH_MAX}
          step={0.05}
          value={draftPitch}
          onValueChange={setDraftPitch}
          onSlidingComplete={commitPitch}
          minimumTrackTintColor={tokens.color.primary}
          maximumTrackTintColor={tokens.color.border}
          thumbTintColor={tokens.color.primary}
          accessibilityLabel={t('settings.speechPitchA11y')}
        />
        <View style={settingsStyles.sliderEnds}>
          <Text style={settingsStyles.sliderEndText}>
            {t('settings.speechPitchLow')}
          </Text>
          <Text style={settingsStyles.sliderEndText}>
            {t('settings.speechPitchHigh')}
          </Text>
        </View>
      </View>

      <View style={settingsStyles.voiceActionStack}>
        <Pressable
          onPress={() => (previewing ? stopPreview() : void previewSpeech())}
          style={({ pressed }) => [
            settingsStyles.primaryBtn,
            pressed && settingsStyles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            previewing
              ? t('settings.speechPreviewStopA11y')
              : t('settings.speechPreviewA11y')
          }
        >
          {previewing ? (
            <ActivityIndicator color={tokens.color.textOnDark} size="small" />
          ) : (
            <Text style={settingsStyles.primaryBtnText}>
              {t('settings.speechPreview')}
            </Text>
          )}
        </Pressable>
        <SettingsSecondaryButton
          label={t('settings.speechReset')}
          onPress={handleReset}
          accessibilityLabel={t('settings.speechResetA11y')}
        />
      </View>

      <Modal
        visible={voicePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVoicePickerVisible(false)}
      >
        <View style={styles.modalWrap}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setVoicePickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t('settings.speechVoiceModalDone')}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('settings.speechVoiceModalTitle')}
              </Text>
              <Pressable
                onPress={() => void loadVoices()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('settings.speechReloadVoicesA11y')}
              >
                <Text style={styles.linkAction}>
                  {t('settings.speechReloadVoices')}
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              value={voiceQuery}
              onChangeText={setVoiceQuery}
              placeholder={t('settings.speechVoiceSearchPh')}
              placeholderTextColor={tokens.color.textMuted}
              accessibilityLabel={t('settings.speechVoiceSearchA11y')}
            />

            {voicesLoading ? (
              <View style={styles.voiceLoading}>
                <ActivityIndicator color={tokens.color.primary} />
                <Text style={styles.voiceLoadingText}>
                  {t('settings.speechVoicesLoading')}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.voiceListModal}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  onPress={() => selectVoice(null)}
                  style={({ pressed }) => [
                    styles.voiceRow,
                    speechSettings.voiceURI == null && styles.voiceRowSelected,
                    pressed && styles.voiceRowPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: speechSettings.voiceURI == null,
                  }}
                >
                  <Text style={styles.voiceName}>
                    {t('settings.speechVoiceSystem')}
                  </Text>
                  <Text style={styles.voiceMeta}>
                    {t('settings.speechVoiceSystemHint')}
                  </Text>
                </Pressable>

                {filteredVoices.length === 0 ? (
                  <Text style={styles.emptyVoices}>
                    {t('settings.speechNoVoices')}
                  </Text>
                ) : (
                  filteredVoices.map((voice) => {
                    const selected = speechSettings.voiceURI === voice.id;
                    return (
                      <Pressable
                        key={voice.id}
                        onPress={() => selectVoice(voice)}
                        style={({ pressed }) => [
                          styles.voiceRow,
                          selected && styles.voiceRowSelected,
                          pressed && styles.voiceRowPressed,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text style={styles.voiceName} numberOfLines={2}>
                          {voice.name}
                        </Text>
                        <Text style={styles.voiceMeta}>
                          {voice.language}
                          {' · '}
                          {voiceCategoryBadge(voice.category)}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}

            <Pressable
              onPress={() => setVoicePickerVisible(false)}
              style={({ pressed }) => [
                styles.modalDoneBtn,
                pressed && styles.voiceRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('settings.speechVoiceModalDone')}
            >
              <Text style={styles.modalDoneText}>
                {t('settings.speechVoiceModalDone')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  speechSubtitle: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: -4,
  },
  voiceFieldLabel: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    marginBottom: 8,
  },
  voiceSelectPressed: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryTint08,
  },
  linkAction: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    color: tokens.color.primary,
    textDecorationLine: 'underline',
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textPrimary,
    backgroundColor: tokens.color.surface,
    minHeight: 44,
  },
  voiceLoading: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voiceLoadingText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBackdrop,
  },
  modalCard: {
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: cardRadius,
    borderTopRightRadius: cardRadius,
    paddingHorizontal: cardPadding,
    paddingTop: cardPadding,
    paddingBottom: cardPadding,
    gap: 8,
    maxHeight: '82%',
    ...shadowSm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  voiceListModal: {
    maxHeight: 340,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bgSecondary,
  },
  modalDoneBtn: {
    minHeight: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textOnDark,
  },
  voiceRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.color.border,
    gap: 2,
    minHeight: touchTarget.min * 0.8,
    justifyContent: 'center',
  },
  voiceRowSelected: {
    backgroundColor: tokens.color.primaryTint08,
    borderLeftWidth: 3,
    borderLeftColor: tokens.color.primary,
  },
  voiceRowPressed: {
    opacity: 0.9,
  },
  voiceName: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    lineHeight: 20,
  },
  voiceMeta: {
    fontSize: tokens.fontSize.xs,
    color: tokens.color.textMuted,
  },
  emptyVoices: {
    padding: 16,
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
    textAlign: 'center',
  },
});
