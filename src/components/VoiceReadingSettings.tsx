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
import { AppButton } from './ui/AppButton';
import {
  cardShadow,
  colors,
  settingsSectionTitle,
  typography,
} from '../theme/colors';
import { cardPadding, cardRadius, radius, touchTarget } from '../theme/layout';

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

  function applyDraft() {
    patchSpeechSettings({ rate: draftRate, pitch: draftPitch });
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
        <Text style={styles.controlLabel}>
          {t('settings.speechRate')}
          <Text style={styles.sliderValueInline}>
            {' '}
            {formatSliderValue(draftRate)}
          </Text>
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={SPEECH_RATE_MIN}
          maximumValue={SPEECH_RATE_MAX}
          step={0.05}
          value={draftRate}
          onValueChange={setDraftRate}
          minimumTrackTintColor={colors.forest}
          maximumTrackTintColor={colors.borderSecondary}
          thumbTintColor={colors.forest}
          accessibilityLabel={t('settings.speechRateA11y')}
        />
        <View style={styles.sliderEnds}>
          <Text style={styles.sliderEndText}>{t('settings.speechRateSlow')}</Text>
          <Text style={styles.sliderEndText}>{t('settings.speechRateFast')}</Text>
        </View>
      </View>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>
          {t('settings.speechPitch')}
          <Text style={styles.sliderValueInline}>
            {' '}
            {formatSliderValue(draftPitch)}
          </Text>
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={SPEECH_PITCH_MIN}
          maximumValue={SPEECH_PITCH_MAX}
          step={0.05}
          value={draftPitch}
          onValueChange={setDraftPitch}
          minimumTrackTintColor={colors.forest}
          maximumTrackTintColor={colors.borderSecondary}
          thumbTintColor={colors.forest}
          accessibilityLabel={t('settings.speechPitchA11y')}
        />
        <View style={styles.sliderEnds}>
          <Text style={styles.sliderEndText}>{t('settings.speechPitchLow')}</Text>
          <Text style={styles.sliderEndText}>{t('settings.speechPitchHigh')}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => (previewing ? stopPreview() : void previewSpeech())}
        style={({ pressed }) => [
          styles.previewLink,
          pressed && styles.previewLinkPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          previewing
            ? t('settings.speechPreviewStopA11y')
            : t('settings.speechPreviewA11y')
        }
      >
        {previewing ? (
          <ActivityIndicator color={colors.forest} size="small" />
        ) : (
          <Text style={styles.previewLinkText}>{t('settings.speechPreview')}</Text>
        )}
      </Pressable>

      <View style={styles.footerActions}>
        <AppButton
          label={t('settings.apply')}
          onPress={applyDraft}
          variant="primary"
          size="sm"
          fullWidth={false}
          style={styles.miniBtn}
        />
        <AppButton
          label={t('settings.speechReset')}
          onPress={handleReset}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={styles.miniBtn}
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
                pressed && styles.previewLinkPressed,
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
    gap: 8,
    padding: cardPadding,
    marginBottom: 10,
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    ...cardShadow,
  },
  blockTitle: settingsSectionTitle,
  hint: {
    fontSize: typography.min,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  platformNote: {
    fontSize: typography.chip,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  controlGroup: {
    gap: 2,
    marginBottom: 4,
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
    color: colors.textPrimary,
  },
  linkAction: {
    fontSize: typography.chip,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    fontWeight: '700',
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
    backgroundColor: colors.parchment,
    borderTopLeftRadius: cardRadius,
    borderTopRightRadius: cardRadius,
    paddingHorizontal: cardPadding,
    paddingTop: cardPadding,
    paddingBottom: cardPadding,
    gap: 8,
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
    color: colors.textPrimary,
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
    color: colors.textOnDark,
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
    backgroundColor: colors.forestTint,
    borderLeftWidth: 3,
    borderLeftColor: colors.forest,
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
    color: colors.textPrimary,
  },
  emptyVoices: {
    padding: 16,
    fontSize: typography.chip,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selectedVoiceCaption: {
    fontSize: typography.chip,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  sliderValueInline: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    opacity: 0.72,
  },
  slider: {
    width: '100%',
    height: 28,
    marginVertical: -2,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  sliderEndText: {
    fontSize: typography.chip,
    color: colors.textPrimary,
    opacity: 0.65,
  },
  previewLink: {
    alignSelf: 'flex-start',
    minHeight: touchTarget.min * 0.65,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  previewLinkPressed: {
    opacity: 0.75,
  },
  previewLinkText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.forest,
    textDecorationLine: 'underline',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  miniBtn: {
    borderRadius: radius.pill,
    minWidth: 72,
  },
});
