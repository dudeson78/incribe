import { Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

/**
 * Pad scroll content below the floating (absolute-positioned) bottom tab bar on native.
 * On web we keep visual padding only (`extra`): the tab bar remains in-flow.
 */
export function useBottomTabScrollPadding(extra = 0): number {
  const tabBarHeight = useBottomTabBarHeight();
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return extra + tabBarHeight;
  }
  return extra;
}
