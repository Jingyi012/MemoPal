import { Colors } from '@/constants/colors';
import { AuthProvider } from '@/contexts/AuthProvider';
import { UserStateProvider } from '@/contexts/UserStateContext';
import { db } from '@/db/client';
import { seedInitialData } from '@/db/seed';
import { useNotificationObserver } from '@/hooks/useNotificationObserver';
import { queryClient } from '@/utils/queryClient';
import { toastConfig } from '@/utils/toastConfig';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import '../../global.css';
import migrations from '../drizzle/migrations';

function AppLayout() {
  const { colorScheme } = useColorScheme();
  const { success: migrationsSuccess, error: migrationError } = useMigrations(db, migrations);
  const [isSeedFinished, setIsSeedFinished] = useState(false);

  useEffect(() => {
    async function runSeed() {
      if (migrationsSuccess) {
        try {
          await seedInitialData();
        } catch (e) {
          console.error('Seeding failed:', e);
        } finally {
          setIsSeedFinished(true);
        }
      }
    }
    runSeed();
  }, [migrationsSuccess]);

  // 4. Notification hook (called unconditionally)
  useNotificationObserver();

  if (migrationError) {
    console.error('Migration failed: ', migrationError);
  }

  // 5. Wait for BOTH migrations and seeding
  if (!migrationsSuccess || !isSeedFinished) {
    return null;
  }

  // useSyncManager();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView
          className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}
          //style={palettes[colorScheme ?? 'light']}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: Colors.slate50,
              },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="palaces/[palaceId]/training" />
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
            <AppLayout />
          </UserStateProvider>
        </AuthProvider>
        <Toast config={toastConfig} topOffset={60} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
