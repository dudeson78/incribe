import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppAuthGate } from './src/components/AppAuthGate';
import { NotificationAppStateSync } from './src/components/NotificationAppStateSync';
import { SettingsProvider } from './src/context/SettingsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar style="dark" />
      <AppAuthGate>
        <SettingsProvider>
          <NotificationAppStateSync />
          <RootNavigator />
        </SettingsProvider>
      </AppAuthGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
