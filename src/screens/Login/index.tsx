import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { login, continueAsGuest } = useAuth();
  const { userState } = useUserState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.includes('@') && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login failed', error?.message || 'Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  useEffect(() => {
    if (userState.isFirstTime) {
      router.replace('/onboarding');
    }
  }, [router, userState.isFirstTime]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <LinearGradient
          colors={[Colors.teal600, Colors.indigo600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 10 }}
          className="mb-6 h-20 w-20 items-center justify-center shadow-lg">
          <Brain size={40} color="white" strokeWidth={1.5} />
        </LinearGradient>

        <Text className="mb-2 text-2xl font-semibold text-gray-900">Welcome to MemoPal</Text>

        <Text className="mb-8 max-w-sm text-center text-gray-600">
          Sign in to sync your progress across all your devices and unlock premium features
        </Text>

        <View className="mb-4 w-full max-w-sm gap-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-xl border-2 border-gray-200 px-4 py-3"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            className="rounded-xl border-2 border-gray-200 px-4 py-3"
          />
        </View>

        <AnimatedPressable
          onPress={handleLogin}
          disabled={!canSubmit || isSubmitting}
          className={`mb-3 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-xl px-6 py-4 ${!canSubmit || isSubmitting ? 'bg-gray-300' : 'bg-teal-600'}`}>
          <AppImage source={require('@assets/images/google-icon.png')} className="h-5 w-5" />
          <Text className="font-medium text-white">{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/register')} className="mb-4">
          <Text className="text-slate-500">Don&apos;t have an account? Create one</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={handleSkip}
          className="w-full max-w-sm flex-row items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-4 active:bg-gray-50">
          <Mail size={18} color="#4b5563" />
          <Text className="font-medium text-gray-600">Continue as Guest (Limited)</Text>
        </AnimatedPressable>
      </View>

      <View className="p-6">
        <Text className="text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};
