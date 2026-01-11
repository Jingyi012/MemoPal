import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain, Mail } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';

interface LoginProps {}

export const LoginScreen: React.FC<LoginProps> = ({}) => {
  const router = useRouter();
  const { login, continueAsGuest } = useAuth();
  const { userState } = useUserState();

  const handleGoogleLogin = () => {
    login();

    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    continueAsGuest();

    router.replace('/(tabs)');
  };

  useEffect(() => {
    if (userState.isFirstTime) {
      router.replace('/onboarding');
    }
  }, []);

  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <LinearGradient
          colors={['#14b8a6', '#4f46e5']} // teal → indigo
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 10,
          }}
          className="mb-6 h-20 w-20 items-center justify-center shadow-lg">
          <Brain size={40} color="white" strokeWidth={1.5} />
        </LinearGradient>

        <Text className="mb-2 text-2xl font-semibold text-gray-900">Welcome to MemoPal</Text>

        <Text className="mb-12 max-w-sm text-center text-gray-600">
          Sign in to sync your progress across all your devices and unlock premium features
        </Text>

        {/* Google Sign In */}
        <AnimatedPressable
          onPress={handleGoogleLogin}
          className="mb-4 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-6 py-4 shadow-sm active:bg-gray-50">
          <Image
            source={require('@assets/images/google-icon.png')}
            className="h-5 w-5"
            resizeMode="contain"
          />

          <Text className="font-medium text-gray-700">Continue with Google</Text>
        </AnimatedPressable>

        {/* Guest */}
        <AnimatedPressable
          onPress={handleSkip}
          className="w-full max-w-sm flex-row items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-4 active:bg-gray-50">
          <Mail size={18} color="#4b5563" />
          <Text className="font-medium text-gray-600">Continue as Guest (Limited)</Text>
        </AnimatedPressable>

        <Text className="mt-6 max-w-xs text-center text-sm text-gray-400">
          Sync progress across devices with Google Login
        </Text>
      </View>

      {/* Footer */}
      <View className="p-6">
        <Text className="text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};
