import { HapticTab } from '@/components/ui/haptic-tab';
import { WebTabBar } from '@/components/WebTabBar';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { Redirect, Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { TabIcon } from '@/components/ui/TabIcon';
import { typography } from '@/theme/typography';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
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
        tabBarLabelStyle: { fontFamily: typography.bodyExtraBold, fontSize: 11 },
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 3 },
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 64 + insets.bottom,
          backgroundColor: theme.paper,
          borderTopColor: theme.line,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: '0px -4px 20px rgba(43,42,61,0.06)',
        },
        sceneStyle: {
          backgroundColor: theme.canvas,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: t('practice'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧩" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('library'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t('progress'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
