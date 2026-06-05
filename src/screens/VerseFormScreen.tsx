import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ReferenceSuggestInput } from '../components/ReferenceSuggestInput';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import type { VersesStackParamList } from '../navigation/types';
import { colors, labelTypography, typography } from '../theme/colors';
import { touchTarget } from '../theme/layout';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<VersesStackParamList, 'VerseForm'>;

export function VerseFormScreen({ navigation, route }: Props) {
  const tabScrollPadding = useBottomTabScrollPadding(40);
  const { t } = useTranslation();
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
      /** RN Web에서는 `Alert.alert`가 무시되거나 콜백이 실행되지 않아 이전 화면으로 못 넘어가는 경우가 많습니다. */
      if (Platform.OS === 'web') {
        navigation.goBack();
      } else {
        Alert.alert(t('common.success'), t('verseForm.saveSuccess'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
      }
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

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.savePressed,
            saving && styles.saveDisabled,
          ]}
          onPress={() => void onSave()}
          disabled={saving}
          accessibilityLabel={
            verseId ? t('verseForm.saveEditA11y') : t('verseForm.saveA11y')
          }
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveText}>
              {verseId ? t('verseForm.saveEdit') : t('verseForm.save')}
            </Text>
          )}
        </Pressable>
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
    borderRadius: 10,
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
    borderRadius: 10,
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
  saveBtn: {
    backgroundColor: colors.forest,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.min,
  },
  savePressed: {
    opacity: 0.92,
  },
  saveDisabled: {
    opacity: 0.55,
  },
  saveText: {
    fontSize: typography.min,
    fontWeight: '800',
    color: colors.white,
  },
});
