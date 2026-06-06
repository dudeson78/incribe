import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useContext, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootTabParamList } from '../../navigation/tabParams';
import { tokens } from '../../theme/tokens';
import { TabBarStrokeIcon, type TabIconName } from './TabBarStrokeIcon';

const ROUTE_ICON: Record<keyof RootTabParamList, TabIconName> = {
  HomeTab: 'training',
  QuizTab: 'quiz',
  VersesTab: 'manage',
  SettingsTab: 'my',
};

/** RN Web — 뷰포트 하단 고정 + frosted glass */
const WEB_TAB_BAR_FIXED: ViewStyle =
  Platform.OS === 'web'
    ? ({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as unknown as ViewStyle)
    : {};

type TabItemProps = {
  label: string;
  icon: TabIconName;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
};

function TabItem({
  label,
  icon,
  focused,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabItemProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: tokens.tabBar.transitionMs,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const pillOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const contentScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const tint = focused ? tokens.color.primary : tokens.color.textMuted;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabPressable}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: contentScale }] }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.activePill, { opacity: pillOpacity }]}
        />
        <TabBarStrokeIcon name={icon} color={tint} />
        <Text style={[styles.label, focused ? styles.labelActive : styles.labelIdle]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  return (
    <View
      onLayout={(e) => {
        onHeightChange?.(e.nativeEvent.layout.height);
      }}
      style={[
        styles.bar,
        WEB_TAB_BAR_FIXED,
        { paddingBottom: bottom, minHeight: tokens.tabBar.height + bottom },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
          const label =
            typeof rawLabel === 'string'
              ? rawLabel
              : typeof rawLabel === 'function'
                ? rawLabel({
                    focused,
                    color: focused
                      ? tokens.color.primary
                      : tokens.color.textMuted,
                    position: 'below-icon',
                    children: route.name,
                  })
                : route.name;

          const icon = ROUTE_ICON[route.name as keyof RootTabParamList];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route),
                target: state.key,
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              label={String(label)}
              icon={icon}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: tokens.color.tabBarGlass,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    paddingTop: 6,
    flexShrink: 0,
    ...(Platform.OS === 'ios' || Platform.OS === 'android'
      ? {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }
      : null),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: tokens.tabBar.height - 6,
    paddingHorizontal: 4,
  },
  tabPressable: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 56,
    position: 'relative',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.color.primaryTint08,
    borderRadius: tokens.radius.full,
  },
  label: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelActive: {
    color: tokens.color.primary,
  },
  labelIdle: {
    color: tokens.color.textMuted,
  },
});
