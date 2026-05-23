import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuthProfile } from '../hooks/useAuthProfile';
import { mapAppError } from '../i18n/mapAppError';
import { colors, typography } from '../theme/colors';

/**
 * Matches prototype `status-bar` + `app-header` (single forest band).
 * 로그인 시 상단에 표시 이름 + 로그아웃.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const topPad = Math.max(insets.top, 12);
  const { signedIn, displayName, ready, signOut } = useAuthProfile();

  async function onSignOut() {
    try {
      await signOut();
    } catch (e) {
      const msg = mapAppError(e, t);
      if (Platform.OS === 'web') {
        globalThis.alert(`${t('errors.title')}\n\n${msg}`);
      } else {
        Alert.alert(t('errors.title'), msg);
      }
    }
  }

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={styles.statusRow}>
        {ready && signedIn && displayName ? (
          <Text
            style={styles.userName}
            numberOfLines={1}
            ellipsizeMode="tail"
            accessibilityLabel={t('account.headerSignedInAsA11y', {
              name: displayName,
            })}
          >
            {displayName}
          </Text>
        ) : (
          <Text style={styles.statusTime} accessibilityElementsHidden>
            {' '}
          </Text>
        )}
        {ready && signedIn ? (
          <Pressable
            onPress={() => void onSignOut()}
            hitSlop={10}
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={t('account.signOut')}
          >
            <Text style={styles.signOutText}>{t('account.signOut')}</Text>
          </Pressable>
        ) : (
          <Text style={styles.statusIcons} accessibilityElementsHidden>
            ···
          </Text>
        )}
      </View>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 24,
    gap: 12,
  },
  userName: {
    flex: 1,
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.white,
    opacity: 0.95,
  },
  signOutBtn: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signOutText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.white,
    textDecorationLine: 'underline',
  },
  statusTime: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.white,
  },
  statusIcons: {
    fontSize: typography.caption,
    color: colors.white,
    opacity: 0.85,
  },
  titleBlock: {
    alignItems: 'center',
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
