import { Colors } from '@/constants/colors';
import { AuthProvider } from '@/contexts/AuthProvider';
import { GamificationRewardProvider } from '@/contexts/GamificationRewardContext';
import { UserStateProvider } from '@/contexts/UserStateContext';
import { db } from '@/db/client';
import { useNotificationObserver } from '@/hooks/useNotificationObserver';
import { useSubscriptionEntitlementSync } from '@/hooks/useSubscriptionEntitlementSync';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useGamificationBootstrap } from '@/hooks/useGamificationBootstrap';
import { queryClient } from '@/utils/queryClient';
import { toastConfig } from '@/utils/toastConfig';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import '../../global.css';
import migrations from '../drizzle/migrations';

function AppLayout() {
  const { colorScheme } = useColorScheme();

  const { success: migrationsSuccess, error: migrationError } = useMigrations(db, migrations);
  const isAppReady = migrationsSuccess;

  // Start observers only after DB migrations are ready.
  useNotificationObserver(isAppReady);

  if (migrationError) {
    console.error('Migration failed: ', migrationError);
  }

  useGamificationBootstrap(isAppReady);
  useSyncManager(isAppReady);
  useSubscriptionGuard(isAppReady);
  useSubscriptionEntitlementSync(isAppReady);

  // 5. Wait for BOTH migrations and seeding
  if (!isAppReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView
          className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}
          //style={palettes[colorScheme ?? 'light']}
        >
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: Colors.slate50,
              },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="palaces/[palaceId]/training" />
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStateProvider>
            <GamificationRewardProvider>
              <AppLayout />
            </GamificationRewardProvider>
          </UserStateProvider>
        </AuthProvider>
        <Toast config={toastConfig} topOffset={60} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
