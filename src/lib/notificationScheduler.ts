import { Platform } from 'react-native';

import { i18n } from '../i18n';
import { getScheduledToday } from '../hooks/useVerses';
import { notificationsSupportedInRuntime } from './notificationsEnv';

let handlerInstalled = false;

/**
 * Cancels existing daily schedules, then (if enabled) requests permission
 * and schedules a daily local notification at the chosen time.
 *
 * Expo Go (SDK 53+): skipped — use a development build for notifications.
 */
export async function syncDailyReminderNotifications(
  enabled: boolean,
  hour: number,
  minute: number
): Promise<void> {
  if (!notificationsSupportedInRuntime()) {
    return;
  }

  const Notifications = await import('expo-notifications');
  const { SchedulableTriggerInputTypes } = Notifications;

  if (!handlerInstalled) {
    handlerInstalled = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  let body = i18n.t('notifications.dailyBody');
  try {
    const rows = await getScheduledToday();
    const pending = rows.filter((r) => !(r.todaySessionRecordedSuccess ?? false));
    if (pending.length > 0) {
      body = i18n.t('notifications.dueCountBody', { count: pending.length });
    }
  } catch {
    /* not signed in or network — keep generic body */
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily review',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'inscribe-daily-review',
    content: {
      title: i18n.t('notifications.dailyTitle'),
      body,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: 'daily' } : {}),
    },
  });
}
