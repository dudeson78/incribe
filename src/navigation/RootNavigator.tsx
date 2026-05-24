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

const Tab = createBottomTabNavigator<RootTabParamList>();
const VersesStack = createNativeStackNavigator<VersesStackParamList>();

function VersesStackNavigator() {
  const { t } = useTranslation();
  return (
    <VersesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: typography.refLarge,
          color: colors.white,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <VersesStack.Screen
        name="VerseList"
        component={VerseListScreen}
        /** 홈·퀴즈·설정과 동일한 상단 브랜드 제목(AppHeader ↔ 스택 헤더) */
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
        tabBarLabelStyle: {
          fontSize: typography.chip,
          fontWeight: '500',
        },
        tabBarStyle: {
          minHeight: touchTarget.min + 8,
          paddingTop: 8,
          paddingBottom: 12,
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
            <Text style={{ color, fontSize: 22 }}>⌂</Text>
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
            <Text style={{ color, fontSize: 22 }}>?</Text>
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
            <Text style={{ color, fontSize: 22 }}>☰</Text>
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
            <Text style={{ color, fontSize: 22 }}>⚙</Text>
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
