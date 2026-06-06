import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';

import { AppButton } from '../components/ui/AppButton';
import { ReferenceSuggestInput } from '../components/ReferenceSuggestInput';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useDialog } from '../context/DialogContext';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { canonicalizeReference, isValidReference } from '../lib/bibleReference';
import type { VersesStackParamList } from '../navigation/types';
import { colors, labelTypography, typography } from '../theme/colors';
import { radius } from '../theme/layout';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<VersesStackParamList, 'VerseForm'>;

export function VerseFormScreen({ navigation, route }: Props) {
  const tabScrollPadding = useBottomTabScrollPadding(40);
  const { t } = useTranslation();
  const dialog = useDialog();
  const verseId = route.params?.verseId;
  const { addVerse, updateVerse, getAllVerses } = useVerses();

  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [referenceValid, setReferenceValid] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!verseId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const referenceInputRef = useRef<TextInputType>(null);
  const bodyInputRef = useRef<TextInputType>(null);

  const loadVerse = useCallback(async () => {
    if (!verseId) {
      setReference('');
      setText('');
      setReferenceValid(false);
      setReferenceError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await getAllVerses();
      const found = rows.find((r) => r.id === verseId);
      if (!found) {
        setError(t('errors.verseNotFound'));
        return;
      }
      setReference(found.reference);
      setText(found.text);
      setReferenceValid(isValidReference(found.reference));
      setReferenceError(null);
    } catch (e) {
      setError(mapAppError(e, t));
    } finally {
      setLoading(false);
    }
  }, [verseId, getAllVerses]);

  useEffect(() => {
    void loadVerse();
  }, [loadVerse]);

  function handleReferenceValidityChange(valid: boolean) {
    setReferenceValid(valid);
    if (valid) {
      setReferenceError(null);
      return;
    }
    if (reference.trim()) {
      setReferenceError(t('verseForm.invalidReference'));
    }
  }

  function handleReferenceChange(next: string) {
    setReference(next);
    const trimmed = next.trim();
    const valid = isValidReference(trimmed);
    setReferenceValid(valid);
    if (valid || !trimmed) {
      setReferenceError(null);
    }
    if (error) {
      setError(null);
    }
  }

  function focusReferenceField() {
    referenceInputRef.current?.focus();
  }

  async function onSave() {
    const refTrim = reference.trim();
    const textTrim = text.trim();
    if (!refTrim || !textTrim) {
      setError(t('verseForm.requiredFields'));
      return;
    }
    if (!isValidReference(refTrim)) {
      setReferenceError(t('verseForm.invalidReference'));
      setReferenceValid(false);
      focusReferenceField();
      return;
    }
    const refCanonical = canonicalizeReference(refTrim);
    setSaving(true);
    setError(null);
    try {
      if (verseId) {
        await updateVerse(verseId, {
          reference: refCanonical,
          text: textTrim,
        });
      } else {
        await addVerse({
          reference: refCanonical,
          text: textTrim,
          verse_group: 'short',
        });
      }
      await dialog.alert({
        title: t('common.success'),
        message: t('verseForm.saveSuccess'),
      });
      navigation.goBack();
    } catch (e) {
      setError(mapAppError(e, t));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabScrollPadding },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errBanner}>
            <Text style={styles.errText}>{error}</Text>
          </View>
        ) : null}

        <ReferenceSuggestInput
          value={reference}
          onChangeText={handleReferenceChange}
          error={referenceError}
          onValidityChange={handleReferenceValidityChange}
          inputRef={referenceInputRef}
        />

        <View style={styles.field}>
          <Text style={[styles.label, !referenceValid && styles.labelDisabled]}>
            {t('verseForm.body')}
          </Text>
          <TextInput
            ref={bodyInputRef}
            style={[styles.area, !referenceValid && styles.areaDisabled]}
            value={text}
            onChangeText={setText}
            placeholder={
              referenceValid
                ? t('verseForm.phBody')
                : t('verseForm.phBodyLocked')
            }
            placeholderTextColor={`${colors.muted}99`}
            multiline
            textAlignVertical="top"
            editable={referenceValid}
            onPressIn={() => {
              if (!referenceValid) {
                focusReferenceField();
              }
            }}
            onFocus={() => {
              if (!referenceValid) {
                setReferenceError(t('verseForm.invalidReference'));
                bodyInputRef.current?.blur();
                focusReferenceField();
              }
            }}
            accessibilityLabel={t('verseForm.bodyA11y')}
          />
        </View>

        {!verseId ? (
          <Text style={styles.hint}>{t('verseForm.hintShortTrack')}</Text>
        ) : null}

        <AppButton
          label={verseId ? t('verseForm.saveEdit') : t('verseForm.save')}
          onPress={() => void onSave()}
          loading={saving}
          accessibilityLabel={
            verseId ? t('verseForm.saveEditA11y') : t('verseForm.saveA11y')
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errBanner: {
    backgroundColor: `${colors.orange}22`,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  errText: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    ...labelTypography,
    marginBottom: 8,
  },
  labelDisabled: {
    opacity: 0.45,
  },
  area: {
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
    lineHeight: 28,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    minHeight: 120,
  },
  areaDisabled: {
    opacity: 0.45,
    backgroundColor: `${colors.card}cc`,
  },
  hint: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
    marginBottom: 20,
  },
});
