import { HapticTab } from '@/components/ui/haptic-tab';
import { WebTabBar } from '@/components/WebTabBar';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { Redirect, Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Platform, Text } from 'react-native';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const { t } = useTranslation('navigation');
  const { user, isAuthenticated, isLoading } = useAuth();
  const isLocalDevMode =
    String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated && !isLocalDevMode) {
    return <Redirect href="/login" />;
  }

  if (user?.onboardingStatus === 'not-started' || user?.onboardingStatus === 'in-progress') {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      tabBar={Platform.OS === 'web' ? (props) => <WebTabBar {...props} /> : undefined}
      screenOptions={{
        tabBarActiveTintColor: theme.berryDeep,
        tabBarInactiveTintColor: theme.inkSoft,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: theme.paper,
          borderTopColor: theme.line,
        },
        sceneStyle: {
          backgroundColor: theme.canvas,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: t('practice'),
          tabBarIcon: () => <Text style={styles.tabIcon}>🧩</Text>,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('library'),
          tabBarIcon: () => <Text style={styles.tabIcon}>📚</Text>,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t('progress'),
          tabBarIcon: () => <Text style={styles.tabIcon}>📈</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: () => <Text style={[styles.tabIcon, styles.profileTabIcon]}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = {
  tabIcon: { fontSize: 18, lineHeight: 22 },
  profileTabIcon: { fontSize: 19 },
};
