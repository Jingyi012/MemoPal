import { SpotlightTourProvider } from '@/features/onboarding/components/SpotlightTourProvider';
import { AuthProvider } from '@/contexts/AuthProvider';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { UserStateProvider, useUserState } from '@/contexts/UserStateContext';
import { useNotificationObserver } from '@/features/notifications/hooks/useNotificationObserver';
import { useSubscriptionEntitlementSync } from '@/features/subscription/hooks/useSubscriptionEntitlementSync';
import { useSubscriptionGuard } from '@/features/subscription/hooks/useSubscriptionGuard';
import { useGamificationBootstrap } from '@/features/gamification/shared/hooks/useGamificationBootstrap';
import { QUERY_CACHE_BUSTER, queryClient, queryPersister } from '@/utils/queryClient';
import { toastConfig } from '@/utils/toastConfig';
import { fontAssets } from '@/theme/typography';
import { memopalThemes } from '@/theme/memopalTheme';
import { nativewindThemes } from '@/utils/theme/nativewindTheme';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import '../../global.css';

function AppLayout() {
  const { userState } = useUserState();
  const { colorScheme, setColorScheme } = useColorScheme();
  const preferredTheme = userState.preferences.theme ?? 'light';
  const themeMode = colorScheme ?? 'light';
  const activeTheme = memopalThemes[themeMode];
  useFonts(fontAssets);

  useEffect(() => {
    setColorScheme(preferredTheme === 'auto' ? 'system' : preferredTheme);
    // NativeWind recreates the setter wrapper during renders; preference is
    // the state transition that should drive this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredTheme]);

  useNotificationObserver(true);
  useGamificationBootstrap(true);
  useSubscriptionGuard(true);
  useSubscriptionEntitlementSync(true);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView
          edges={['left', 'right', 'bottom']}
          className={`${colorScheme === 'dark' ? 'dark' : ''} flex-1 bg-canvas`}
          style={nativewindThemes[themeMode]}>
          <NetworkStatusBanner />
          <SpotlightTourProvider>
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: activeTheme.canvas,
              },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="notifications" />
          </Stack>
          </SpotlightTourProvider>
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          buster: QUERY_CACHE_BUSTER,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success' &&
              !['ai-image', 'ai-credits'].includes(String(query.queryKey[0])),
          },
        }}>
        <AuthProvider>
          <UserStateProvider>
            <AppLayout />
          </UserStateProvider>
        </AuthProvider>
        <Toast config={toastConfig} topOffset={60} />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
