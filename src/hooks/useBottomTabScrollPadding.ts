import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

/**
 * Bottom tab bar is overlay-style (native: absolute / web: fixed). Reserve space under it
 * so scroll content stays visible above the bar.
 */
export function useBottomTabScrollPadding(extra = 0): number {
  const tabBarHeight = useBottomTabBarHeight();
  return extra + tabBarHeight;
}
