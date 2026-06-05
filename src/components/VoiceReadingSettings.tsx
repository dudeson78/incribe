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
import { colors, settingsSectionTitle, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

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
  const previewRunRef = useRef(0);

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

  async function previewSpeech() {
    const runId = ++previewRunRef.current;
    stopSpeech();
    setPreviewing(true);
    try {
      await speakWithSettings(
        t('settings.speechPreviewSample'),
        speechSettings,
      );
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
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{t('settings.speechSection')}</Text>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>{t('settings.speechVoice')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.voiceSelectBtn,
            pressed && styles.voiceRowPressed,
          ]}
          onPress={() => setVoicePickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('settings.speechVoicePickA11y')}
        >
          <Text style={styles.voiceSelectBtnText} numberOfLines={1}>
            {currentVoiceLabel}
          </Text>
          <Text style={styles.voiceSelectChevron}>▾</Text>
        </Pressable>
      </View>

      <View style={styles.controlGroup}>
        <View style={styles.sliderHeader}>
          <Text style={styles.controlLabel}>{t('settings.speechRate')}</Text>
          <Text style={styles.sliderValue}>{formatSliderValue(speechSettings.rate)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={SPEECH_RATE_MIN}
          maximumValue={SPEECH_RATE_MAX}
          step={0.05}
          value={speechSettings.rate}
          onValueChange={(rate) => patchSpeechSettings({ rate })}
          minimumTrackTintColor={colors.forest}
          maximumTrackTintColor={colors.borderSecondary}
          thumbTintColor={colors.orange}
          accessibilityLabel={t('settings.speechRateA11y')}
        />
        <View style={styles.sliderEnds}>
          <Text style={styles.sliderEndText}>{t('settings.speechRateSlow')}</Text>
          <Text style={styles.sliderEndText}>{t('settings.speechRateFast')}</Text>
        </View>
      </View>

      <View style={styles.controlGroup}>
        <View style={styles.sliderHeader}>
          <Text style={styles.controlLabel}>{t('settings.speechPitch')}</Text>
          <Text style={styles.sliderValue}>{formatSliderValue(speechSettings.pitch)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={SPEECH_PITCH_MIN}
          maximumValue={SPEECH_PITCH_MAX}
          step={0.05}
          value={speechSettings.pitch}
          onValueChange={(pitch) => patchSpeechSettings({ pitch })}
          minimumTrackTintColor={colors.forest}
          maximumTrackTintColor={colors.borderSecondary}
          thumbTintColor={colors.orange}
          accessibilityLabel={t('settings.speechPitchA11y')}
        />
        <View style={styles.sliderEnds}>
          <Text style={styles.sliderEndText}>{t('settings.speechPitchLow')}</Text>
          <Text style={styles.sliderEndText}>{t('settings.speechPitchHigh')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => (previewing ? stopPreview() : void previewSpeech())}
          style={({ pressed }) => [
            styles.previewBtn,
            previewing && styles.previewBtnActive,
            pressed && styles.previewBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            previewing
              ? t('settings.speechPreviewStopA11y')
              : t('settings.speechPreviewA11y')
          }
        >
          {previewing ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.previewBtnText}>{t('settings.speechPreview')}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => resetSpeechSettings()}
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && styles.resetBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('settings.speechResetA11y')}
        >
          <Text style={styles.resetBtnText}>{t('settings.speechReset')}</Text>
        </Pressable>
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
              placeholderTextColor={`${colors.muted}99`}
              accessibilityLabel={t('settings.speechVoiceSearchA11y')}
            />

            {voicesLoading ? (
              <View style={styles.voiceLoading}>
                <ActivityIndicator color={colors.forest} />
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
                pressed && styles.previewBtnPressed,
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
  block: {
    gap: 12,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.forest}18`,
  },
  blockTitle: settingsSectionTitle,
  hint: {
    fontSize: typography.min,
    color: colors.muted,
    lineHeight: 22,
  },
  platformNote: {
    fontSize: typography.chip,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  controlGroup: {
    gap: 8,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  controlLabel: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
  },
  linkAction: {
    fontSize: typography.chip,
    fontWeight: '700',
    color: colors.orange,
    textDecorationLine: 'underline',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: `${colors.forest}33`,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.min,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundPrimary,
    minHeight: touchTarget.min * 0.85,
  },
  voiceLoading: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voiceLoadingText: {
    fontSize: typography.chip,
    color: colors.textSecondary,
  },
  voiceSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: touchTarget.min,
    borderWidth: 1,
    borderColor: `${colors.forest}33`,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundPrimary,
  },
  voiceSelectBtnText: {
    flex: 1,
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  voiceSelectChevron: {
    fontSize: typography.min,
    color: colors.forest,
    fontWeight: '700',
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 90, 61, 0.45)',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalTitle: {
    fontSize: typography.refLarge,
    fontWeight: '700',
    color: colors.forest,
  },
  voiceListModal: {
    maxHeight: 340,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderTertiary,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundPrimary,
  },
  modalDoneBtn: {
    minHeight: touchTarget.min,
    borderRadius: radius.lg,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
  voiceList: {
    maxHeight: 220,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderTertiary,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundPrimary,
  },
  voiceRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderTertiary,
    gap: 2,
    minHeight: touchTarget.min * 0.8,
    justifyContent: 'center',
  },
  voiceRowSelected: {
    backgroundColor: `${colors.orange}16`,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  voiceRowPressed: {
    opacity: 0.9,
  },
  voiceName: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  voiceMeta: {
    fontSize: typography.chip,
    color: colors.textSecondary,
  },
  emptyVoices: {
    padding: 16,
    fontSize: typography.chip,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedVoiceCaption: {
    fontSize: typography.chip,
    color: colors.forest,
    lineHeight: 18,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderValue: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.orange,
    minWidth: 40,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEndText: {
    fontSize: typography.chip,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  previewBtn: {
    flexGrow: 1,
    minWidth: 140,
    minHeight: touchTarget.min,
    borderRadius: radius.lg,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewBtnActive: {
    backgroundColor: `${colors.forest}cc`,
  },
  previewBtnPressed: {
    opacity: 0.92,
  },
  previewBtnText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
  resetBtn: {
    minHeight: touchTarget.min,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  resetBtnPressed: {
    opacity: 0.9,
  },
  resetBtnText: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
  },
});
