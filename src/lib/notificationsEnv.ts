import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Local scheduling is unsupported / unreliable on web browsers.
 * Expo Go SDK 53+ also disables push plumbing — use a dev build for notifications.
 */
export function notificationsSupportedInRuntime(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}
