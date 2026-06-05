import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HomeScreen } from '../screens/HomeScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VerseFormScreen } from '../screens/VerseFormScreen';
import { VerseListScreen } from '../screens/VerseListScreen';
import { colors, typography } from '../theme/colors';
import type { RootTabParamList } from './tabParams';
import type { VersesStackParamList } from './types';

/** RN Web 타입에는 없지만 브라우저에서 뷰포트 하단 고정에 필요 */
const WEB_TAB_BAR_VIEWPORT_FIXED = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  width: '100%',
  zIndex: 100,
  overflow: 'visible',
} as unknown as ViewStyle;

/** 픽토그램 줄 · 아래 줄에 탭 이름 */
const TAB_ICON_PX = 20;
const TAB_TEXT_ICON_PX = 17;

const Tab = createBottomTabNavigator<RootTabParamList>();
const VersesStack = createNativeStackNavigator<VersesStackParamList>();

function VersesStackNavigator() {
  const { t } = useTranslation();
  return (
    <VersesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.forest,
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: typography.refLarge,
          color: colors.forest,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        /** 전체 화면 뒤로 스와이프(iOS 최신 기본값) 시 탭·씬 레이아웃이 같이 움직이는 느낌을 줄이기 위해 에지 제스처만 허용 */
        ...(Platform.OS === 'ios' ? ({ fullScreenGestureEnabled: false } as const) : null),
      }}
    >
      <VersesStack.Screen
        name="VerseList"
        component={VerseListScreen}
        /** 스택 헤더는 바탕(밝은 회색)·제목 초록 글자 */
        options={{ title: t('verses.manageScreenTitle') }}
      />
      <VersesStack.Screen
        name="VerseForm"
        component={VerseFormScreen}
        options={({ route }) => ({
          title: route.params?.verseId
            ? t('verseForm.titleEdit')
            : t('verseForm.titleAdd'),
        })}
      />
    </VersesStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        /** 탭 전환 시 씬이 좌우로 밀리는 애니메이션 비활성 — 스와이프·스크롤과 겹치면 탭바가 따라 움직이는 듯 보일 수 있음 */
        animation: 'none',
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.textSecondary,
        /** 라벨이 아래에 오도록 명시(iPad/가로폭 넓음에서 아이콘 옆으로 붙으면 줄바꿈·잘림이 생김). */
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: true,
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 2,
          lineHeight: 16,
          textAlign: 'center',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          /** 웹·좁은 창에서 플렉스로 탭 줄이 접히거나 밀려 보이지 않게 */
          ...(Platform.OS === 'web'
            ? ({
                flexGrow: 1,
                flexShrink: 1,
                minWidth: 0,
              } as const)
            : {}),
        },
        tabBarStyle: {
          /** 라이브러리 기본 height(약 49)는 라벨+아이콘을 세로 배치하면 잘리므로 높이를 명시 */
          flexShrink: 0,
          /** 네이티브는 고정 높이. 웹은 고정 height를 주면 BottomTabBar 내부 콘텐츠가 잘려 아이콘 아래 라벨 줄이 안 보이므로 minHeight로 콘텐츠에 맞게 늘어나게 한다. */
          ...(Platform.OS === 'web'
            ? ({ minHeight: 76 } as const)
            : {
                height:
                  Platform.OS === 'android' || Platform.OS === 'ios' ? 64 : 68,
              }),
          /** BottomTabBar가 `paddingBottom: insets.bottom`을 적용하지만 `tabBarStyle`이 마지막이라 여기서 paddingBottom을 주면 그 값으로 덮여 세이프에리어가 깨져 하단에 빈 공간이 보일 수 있음. 네이티브는 라이브러리 패딩만 쓴다. */
          paddingTop: Platform.OS === 'web' ? 8 : 4,
          ...(Platform.OS === 'web' ? ({ paddingBottom: 12 } as const) : null),
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 0.5,
          borderTopColor: colors.borderTertiary,
          ...(Platform.OS === 'web'
            ? WEB_TAB_BAR_VIEWPORT_FIXED
            : Platform.OS === 'ios' || Platform.OS === 'android'
              ? ({
                  position: 'absolute' as const,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  elevation: Platform.OS === 'android' ? 16 : undefined,
                  shadowColor: Platform.OS === 'ios' ? '#000000' : undefined,
                  shadowOffset:
                    Platform.OS === 'ios' ? { width: 0, height: -2 } : undefined,
                  shadowOpacity: Platform.OS === 'ios' ? 0.08 : undefined,
                  shadowRadius: Platform.OS === 'ios' ? 6 : undefined,
                } as const)
              : {}),
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="bulb-outline" size={TAB_ICON_PX} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizScreen}
        options={{
          title: t('tabs.quiz'),
          tabBarLabel: t('tabs.quiz'),
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_TEXT_ICON_PX }}>?</Text>
          ),
        }}
      />
      <Tab.Screen
        name="VersesTab"
        component={VersesStackNavigator}
        options={{
          title: t('tabs.verses'),
          tabBarLabel: t('tabs.verses'),
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_TEXT_ICON_PX }}>☰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: t('tabs.settings'),
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_TEXT_ICON_PX }}>⚙</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <View style={styles.navigationRoot}>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  /** RN Web 탭바는 상위 높이 체인이 깨지면 접힘 — 안전 플렉스 래퍼 */
  navigationRoot: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ minHeight: 0 } as const) : null),
  },
});
