import './src/i18n';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppAuthGate } from './src/components/AppAuthGate';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { SettingsProvider } from './src/context/SettingsContext';
import { DialogProvider } from './src/context/DialogContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

/** Chrome/Google 등 페이지 번역기가 SPA 문구를 의미 치환으로 망가뜨리는 완화 (웹 전용). */
function useWebShieldAgainstPageTranslation(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.classList.add('notranslate');

    const already = document.querySelector(
      'meta[name="google"][content="notranslate"]',
    );
    if (!already) {
      const m = document.createElement('meta');
      m.name = 'google';
      m.content = 'notranslate';
      document.head.appendChild(m);
    }
  }, []);
}

export default function App() {
  useWebShieldAgainstPageTranslation();

  const tree = (
    <>
      <StatusBar style="dark" />
      <DialogProvider>
        <AppAuthGate>
          <SettingsProvider>
            <View style={styles.flexFillMinZero}>
              <RootNavigator />
            </View>
          </SettingsProvider>
        </AppAuthGate>
      </DialogProvider>
    </>
  );

  return (
    <SafeAreaProvider style={styles.root}>
      <AppErrorBoundary>
        {Platform.OS === 'web' ? (
          <View
            style={styles.root}
            // react-native-web → div; Google 번역 확장/CMT가 자식 노드를 고치지 않도록
            {...({ className: 'notranslate', translate: 'no' } as Record<string, string>)}
          >
            {tree}
          </View>
        ) : (
          tree
        )}
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  /** 하단 탭 네비·씬 플렉스 체인 (웹 좁은 창 포함) */
  flexFillMinZero: {
    flex: 1,
    minHeight: 0,
  },
});
