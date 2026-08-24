import { AuthProvider } from '@/contexts/AuthProvider';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { GamificationRewardProvider } from '@/contexts/GamificationRewardContext';
import { UserStateProvider } from '@/contexts/UserStateContext';
import { useNotificationObserver } from '@/features/notifications/hooks/useNotificationObserver';
import { useSubscriptionEntitlementSync } from '@/features/subscription/hooks/useSubscriptionEntitlementSync';
import { useSubscriptionGuard } from '@/features/subscription/hooks/useSubscriptionGuard';
import { useGamificationBootstrap } from '@/features/gamification/shared/hooks/useGamificationBootstrap';
import { QUERY_CACHE_BUSTER, queryClient, queryPersister } from '@/utils/queryClient';
import { toastConfig } from '@/utils/toastConfig';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import '../../global.css';

function AppLayout() {
  const { colorScheme } = useColorScheme();

  useNotificationObserver(true);
  useGamificationBootstrap(true);
  useSubscriptionGuard(true);
  useSubscriptionEntitlementSync(true);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView
          edges={['left', 'right', 'bottom']}
          className={colorScheme === 'dark' ? 'dark flex-1 bg-[#1E1A30]' : 'flex-1 bg-[#FFFDF8]'}
          //style={palettes[colorScheme ?? 'light']}
        >
          <NetworkStatusBanner />
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: '#FFFDF8',
              },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="rewards-history" />
          </Stack>
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
        }}>
        <AuthProvider>
          <UserStateProvider>
            <GamificationRewardProvider>
              <AppLayout />
            </GamificationRewardProvider>
          </UserStateProvider>
        </AuthProvider>
        <Toast config={toastConfig} topOffset={60} />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
