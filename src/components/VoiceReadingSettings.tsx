import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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
  type SpeechVoiceCategoryFilter,
  type SpeechVoiceOption,
} from '../types/speechSettings';
import { colors, settingsSectionTitle, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

function formatSliderValue(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '');
}

const VOICE_CATEGORY_FILTERS: SpeechVoiceCategoryFilter[] = [
  'all',
  'female',
  'male',
  'child',
];

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
  const [voiceCategory, setVoiceCategory] =
    useState<SpeechVoiceCategoryFilter>('all');
  const [previewing, setPreviewing] = useState(false);
  const [qualityHelpOpen, setQualityHelpOpen] = useState(false);
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
    () => filterSpeechVoices(voices, voiceQuery, voiceCategory),
    [voices, voiceQuery, voiceCategory],
  );

  function categoryLabel(category: SpeechVoiceCategoryFilter): string {
    return t(`settings.speechVoiceCategory.${category}`);
  }

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
  }

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
      <Text style={styles.hint}>{t('settings.speechHint')}</Text>

      {Platform.OS === 'web' ? (
        <Text style={styles.platformNote}>{t('settings.speechWebNote')}</Text>
      ) : (
        <Text style={styles.platformNote}>{t('settings.speechNativeNote')}</Text>
      )}

      <View style={styles.qualityHelp}>
        <Pressable
          onPress={() => setQualityHelpOpen((v) => !v)}
          style={({ pressed }) => [
            styles.qualityToggle,
            pressed && styles.qualityTogglePressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: qualityHelpOpen }}
        >
          <Text style={styles.qualityToggleText}>
            {t('settings.speechQualityTitle')}
          </Text>
          <Text style={styles.qualityToggleAction}>
            {qualityHelpOpen
              ? t('settings.speechQualityToggleHide')
              : t('settings.speechQualityToggleShow')}
          </Text>
        </Pressable>

        {qualityHelpOpen ? (
          <View style={styles.qualityPanel}>
            <Text style={styles.qualityIntro}>
              {t('settings.speechQualityIntro')}
            </Text>

            {Platform.OS === 'web' ? (
              <View style={styles.qualityStep}>
                <Text style={styles.qualityStepTitle}>
                  {t('settings.speechQualityWebTitle')}
                </Text>
                <Text style={styles.qualityStepText}>
                  {t('settings.speechQualityWeb')}
                </Text>
              </View>
            ) : null}

            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <View style={styles.qualityStep}>
                <Text style={styles.qualityStepTitle}>
                  {t('settings.speechQualityIosTitle')}
                </Text>
                <Text style={styles.qualityStepText}>
                  {t('settings.speechQualityIosSteps')}
                </Text>
              </View>
            ) : null}

            {Platform.OS === 'android' || Platform.OS === 'web' ? (
              <View style={styles.qualityStep}>
                <Text style={styles.qualityStepTitle}>
                  {t('settings.speechQualityAndroidTitle')}
                </Text>
                <Text style={styles.qualityStepText}>
                  {t('settings.speechQualityAndroidSteps')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.controlGroup}>
        <View style={styles.controlHeader}>
          <Text style={styles.controlLabel}>{t('settings.speechVoice')}</Text>
          <Pressable
            onPress={() => void loadVoices()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('settings.speechReloadVoicesA11y')}
          >
            <Text style={styles.linkAction}>{t('settings.speechReloadVoices')}</Text>
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

        <View style={styles.categoryRow}>
          {VOICE_CATEGORY_FILTERS.map((cat) => {
            const selected = voiceCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setVoiceCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                  pressed && styles.categoryChipPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={categoryLabel(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selected && styles.categoryChipTextSelected,
                  ]}
                >
                  {categoryLabel(cat)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.categoryNote}>{t('settings.speechVoiceCategoryNote')}</Text>

        {voicesLoading ? (
          <View style={styles.voiceLoading}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.voiceLoadingText}>
              {t('settings.speechVoicesLoading')}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.voiceList}
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
              accessibilityState={{ selected: speechSettings.voiceURI == null }}
            >
              <Text style={styles.voiceName}>{t('settings.speechVoiceSystem')}</Text>
              <Text style={styles.voiceMeta}>{t('settings.speechVoiceSystemHint')}</Text>
            </Pressable>

            {filteredVoices.length === 0 ? (
              <Text style={styles.emptyVoices}>
                {voiceCategory === 'all'
                  ? t('settings.speechNoVoices')
                  : t('settings.speechNoVoicesInCategory')}
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

        {selectedVoice ? (
          <Text style={styles.selectedVoiceCaption}>
            {t('settings.speechSelectedVoice', {
              name: selectedVoice.name,
              lang: selectedVoice.language,
            })}
          </Text>
        ) : null}
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
  qualityHelp: {
    borderWidth: 1,
    borderColor: `${colors.orange}40`,
    borderRadius: radius.md,
    backgroundColor: `${colors.orange}0f`,
    overflow: 'hidden',
  },
  qualityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: touchTarget.min * 0.9,
  },
  qualityTogglePressed: {
    opacity: 0.85,
  },
  qualityToggleText: {
    flexShrink: 1,
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
  },
  qualityToggleAction: {
    fontSize: typography.chip,
    fontWeight: '700',
    color: colors.orange,
    textDecorationLine: 'underline',
  },
  qualityPanel: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 12,
  },
  qualityIntro: {
    fontSize: typography.chip,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  qualityStep: {
    gap: 4,
  },
  qualityStepTitle: {
    fontSize: typography.chip,
    fontWeight: '800',
    color: colors.forest,
  },
  qualityStepText: {
    fontSize: typography.chip,
    color: colors.textSecondary,
    lineHeight: 20,
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundSecondary,
    minHeight: touchTarget.min * 0.7,
    justifyContent: 'center',
  },
  categoryChipSelected: {
    borderColor: colors.forest,
    backgroundColor: `${colors.forest}12`,
  },
  categoryChipPressed: {
    opacity: 0.9,
  },
  categoryChipText: {
    fontSize: typography.chip,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.forest,
    fontWeight: '700',
  },
  categoryNote: {
    fontSize: typography.chip,
    color: colors.textSecondary,
    lineHeight: 18,
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
