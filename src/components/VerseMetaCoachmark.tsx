import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from './ui/AppButton';
import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

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
      <AppButton
        label={t('verses.metaCoachmarkDismiss')}
        onPress={() => void dismiss()}
        variant="secondary"
        size="sm"
        fullWidth={false}
        style={styles.dismissBtn}
        accessibilityLabel={t('verses.metaCoachmarkDismiss')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.sky,
    borderWidth: 1,
    borderColor: colors.pastelBlueBorderSoft,
    gap: 8,
  },
  title: {
    fontSize: typography.min,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
});
