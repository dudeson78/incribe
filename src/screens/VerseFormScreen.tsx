import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '../components/ui/AppButton';
import { ReferenceSuggestInput } from '../components/ReferenceSuggestInput';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useDialog } from '../context/DialogContext';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
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
  const [loading, setLoading] = useState(!!verseId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVerse = useCallback(async () => {
    if (!verseId) {
      setReference('');
      setText('');
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
    } catch (e) {
      setError(mapAppError(e, t));
    } finally {
      setLoading(false);
    }
  }, [verseId, getAllVerses]);

  useEffect(() => {
    void loadVerse();
  }, [loadVerse]);

  async function onSave() {
    const refTrim = reference.trim();
    const textTrim = text.trim();
    if (!refTrim || !textTrim) {
      setError(t('verseForm.requiredFields'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (verseId) {
        await updateVerse(verseId, {
          reference: refTrim,
          text: textTrim,
        });
      } else {
        await addVerse({
          reference: refTrim,
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

        <ReferenceSuggestInput value={reference} onChangeText={setReference} />

        <View style={styles.field}>
          <Text style={styles.label}>{t('verseForm.body')}</Text>
          <TextInput
            style={styles.area}
            value={text}
            onChangeText={setText}
            placeholder={t('verseForm.phBody')}
            placeholderTextColor={`${colors.muted}99`}
            multiline
            textAlignVertical="top"
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
    color: colors.forest,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    ...labelTypography,
    marginBottom: 8,
  },
  area: {
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
    lineHeight: 28,
    color: colors.forest,
    backgroundColor: colors.card,
    minHeight: 120,
  },
  hint: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.muted,
    marginBottom: 20,
  },
});
