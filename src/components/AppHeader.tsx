import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';

/**
 * 상단 브랜드 밴드(App 제목 · 부제). 계정 이름·로그아웃은 MY 탭(Settings) 상단으로 이동.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const topPad = Math.max(insets.top, 12);

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{t('tabs.appTitle')}</Text>
        <Text style={styles.subtitle}>{t('tabs.appSubtitle')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.forest,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 0,
  },
  titleBlock: {
    alignItems: 'center',
    paddingTop: 4,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '500',
    letterSpacing: 1,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: typography.caption,
    color: colors.white,
    opacity: 0.82,
    textAlign: 'center',
  },
});
