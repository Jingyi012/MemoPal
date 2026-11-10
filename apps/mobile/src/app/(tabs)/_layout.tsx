import { SpotlightTarget } from '@/features/onboarding/components/SpotlightTourProvider';
import { HapticTab } from '@/components/ui/haptic-tab';
import { WebTabBar } from '@/components/WebTabBar';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { TabIcon } from '@/components/ui/TabIcon';
import { typography } from '@/theme/typography';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const { t } = useTranslation('navigation');
  const { isAuthenticated, isLoading, user } = useAuth();
  const isLocalDevMode =
    String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated && !isLocalDevMode) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={Platform.OS === 'web' ? (props) => <WebTabBar {...props} /> : undefined}
      screenOptions={{
        tabBarActiveTintColor: theme.violetDeep,
        tabBarInactiveTintColor: theme.inkSoft,
        headerShown: false,
        tabBarLabelStyle: { fontFamily: typography.bodyExtraBold, fontSize: 10 },
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
          tabBarIcon: ({ focused }) => <TabIcon icon="home" focused={focused} />,
        }}
      />
      <Tabs.Screen name="learn" options={{ title: t('learn'), tabBarIcon: ({ focused }) => <TabIcon icon="book" focused={focused} /> }} />
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen
        name="library"
        options={{
          href: user?.accountMode === 'RestrictedLearner' ? null : undefined,
          title: t('memory'),
          tabBarIcon: ({ focused }) => <SpotlightTarget id="library" onActivate={() => router.navigate('/(tabs)/library')}><TabIcon icon="library" focused={focused} /></SpotlightTarget>,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: user?.accountMode === 'RestrictedLearner' ? null : undefined,
          title: t('community'),
          tabBarIcon: ({ focused }) => <TabIcon icon="globe" focused={focused} />,
        }}
      />
      <Tabs.Screen name="achievements" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('me'),
          tabBarIcon: ({ focused }) => <TabIcon icon="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
