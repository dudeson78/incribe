import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { filterReferenceSuggestions } from '../constants/referenceSuggestions';
import { colors, labelTypography, typography } from '../theme/colors';
import { radius } from '../theme/layout';
import { useTranslation } from 'react-i18next';

type ReferenceSuggestInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function ReferenceSuggestInput({
  value,
  onChangeText,
  placeholder,
}: ReferenceSuggestInputProps) {
  const { t } = useTranslation();
  const ph = placeholder ?? t('verseForm.phReference');
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearBlurTimer() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  useEffect(
    () => () => {
      clearBlurTimer();
    },
    []
  );

  const suggestions = useMemo(
    () => filterReferenceSuggestions(value, 12),
    [value]
  );

  const showList = focused && suggestions.length > 0 && value.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('reference.label')}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={ph}
        placeholderTextColor={`${colors.muted}99`}
        onFocus={() => {
          clearBlurTimer();
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 200);
        }}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={t('verseForm.accessibilityRef')}
      />
      {showList ? (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                onPress={() => {
                  clearBlurTimer();
                  onChangeText(item);
                  setFocused(false);
                }}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            )}
            style={styles.list}
            nestedScrollEnabled
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    zIndex: 2,
  },
  label: {
    ...labelTypography,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: `${colors.forest}44`,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
    color: colors.forest,
    backgroundColor: colors.card,
    minHeight: 48,
  },
  dropdown: {
    marginTop: 6,
    maxHeight: 200,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.forest}33`,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 200,
  },
  suggestion: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${colors.forest}22`,
  },
  suggestionPressed: {
    backgroundColor: `${colors.orange}22`,
  },
  suggestionText: {
    fontSize: typography.body,
    color: colors.forest,
  },
});
