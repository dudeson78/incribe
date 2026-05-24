import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HomeScreen } from '../screens/HomeScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VerseFormScreen } from '../screens/VerseFormScreen';
import { VerseListScreen } from '../screens/VerseListScreen';
import { colors, typography } from '../theme/colors';
import { touchTarget } from '../theme/layout';
import type { RootTabParamList } from './tabParams';
import type { VersesStackParamList } from './types';

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
      }}
    >
      <VersesStack.Screen
        name="VerseList"
        component={VerseListScreen}
        /** 스택 헤더는 바탕(밝은 회색)·제목 초록 글자 */
        options={{ title: t('tabs.appTitle') }}
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
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.textSecondary,
        /** 아이콘 다음 줄에 라벨 */
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: true,
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: typography.chip - 1,
          fontWeight: '500',
          marginTop: 2,
          lineHeight: 14,
          textAlign: 'center',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          minHeight: touchTarget.min + 2,
          paddingTop: 6,
          paddingBottom: 10,
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 0.5,
          borderTopColor: colors.borderTertiary,
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
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
