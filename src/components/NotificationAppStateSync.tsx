import { useCallback, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSettings } from '../context/SettingsContext';
import { syncDailyReminderNotifications } from '../lib/notificationScheduler';

/**
 * Re-syncs the daily local notification when the app becomes active so the
 * scheduled message reflects the latest Supabase due-count.
 */
export function NotificationAppStateSync() {
  const {
    loaded,
    notificationsEnabled,
    notificationHour,
    notificationMinute,
    language,
  } = useSettings();

  const sync = useCallback(() => {
    if (!loaded) return;
    void syncDailyReminderNotifications(
      notificationsEnabled,
      notificationHour,
      notificationMinute
    );
  }, [
    loaded,
    notificationsEnabled,
    notificationHour,
    notificationMinute,
    language,
  ]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    function onChange(next: AppStateStatus) {
      if (next === 'active') sync();
    }
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [sync]);

  return null;
}
