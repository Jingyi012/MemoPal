import { Colors } from '@/constants/colors';
import { AuthProvider } from '@/contexts/AuthProvider';
import { UserStateProvider } from '@/contexts/UserStateContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

function AppLayout() {
  const { colorScheme } = useColorScheme();
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
      <AuthProvider>
        <UserStateProvider>
          <AppLayout />
        </UserStateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
