import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

const STORAGE_KEY = '@inscribe/coachmark_verse_meta_v1';

export function VerseMetaCoachmark() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        setVisible(seen !== '1');
      } catch {
        if (mounted) setVisible(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function dismiss() {
    setVisible(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* 저장 실패해도 이번 세션에서는 숨김 */
    }
  }

  if (!visible) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('verses.metaCoachmarkTitle')}</Text>
      <Text style={styles.body}>{t('verses.metaCoachmarkBody')}</Text>
      <Pressable
        style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
        onPress={() => void dismiss()}
        accessibilityRole="button"
        accessibilityLabel={t('verses.metaCoachmarkDismiss')}
      >
        <Text style={styles.dismissText}>{t('verses.metaCoachmarkDismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.pastelBlueBg,
    borderWidth: 1,
    borderColor: colors.pastelBlueBorderSoft,
    gap: 8,
  },
  title: {
    fontSize: typography.min,
    fontWeight: '800',
    color: colors.forest,
  },
  body: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    minHeight: touchTarget.min * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.forest,
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.9,
  },
});
