import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTabBar } from '../components/navigation/AppTabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VerseFormScreen } from '../screens/VerseFormScreen';
import { VerseListScreen } from '../screens/VerseListScreen';
import { colors, typography } from '../theme/colors';
import { tokens } from '../theme/tokens';
import type { RootTabParamList } from './tabParams';
import type { VersesStackParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const VersesStack = createNativeStackNavigator<VersesStackParamList>();

function VersesStackNavigator() {
  const { t } = useTranslation();
  return (
    <VersesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: typography.refLarge,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        ...(Platform.OS === 'ios' ? ({ fullScreenGestureEnabled: false } as const) : null),
      }}
    >
      <VersesStack.Screen
        name="VerseList"
        component={VerseListScreen}
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
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        animation: 'none',
        headerShown: false,
        tabBarActiveTintColor: tokens.color.primary,
        tabBarInactiveTintColor: tokens.color.textMuted,
        tabBarStyle: {
          position: 'absolute',
          height: tokens.tabBar.height,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizScreen}
        options={{
          title: t('tabs.quiz'),
          tabBarLabel: t('tabs.quiz'),
        }}
      />
      <Tab.Screen
        name="VersesTab"
        component={VersesStackNavigator}
        options={{
          title: t('tabs.verses'),
          tabBarLabel: t('tabs.verses'),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: t('tabs.settings'),
          tabBarLabel: t('tabs.settings'),
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
  navigationRoot: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ minHeight: 0 } as const) : null),
  },
});
