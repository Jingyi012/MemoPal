import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { referralApi } from '@/api/referral';
import { createUserRepository } from '@/repositories/user.repo';
import { getFacebookAccessToken, getGoogleAccessToken } from '@/services/socialAuth.service';
import { syncEntitlementToLocal } from '@/services/subscription.service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Register() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = displayName.trim().length > 1 && email.includes('@') && password.length >= 6;
  const socialEnabled = false;

  const handleRegister = async () => {
    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });

      const normalizedReferralCode = referralCode.trim().toUpperCase();
      if (normalizedReferralCode) {
        try {
          await referralApi.redeem(normalizedReferralCode);
          const currentUser = await createUserRepository().getCurrent();
          if (currentUser) {
            await syncEntitlementToLocal(currentUser.id);
          }
          Toast.show({
            type: 'success',
            text1: 'Referral applied',
            text2: 'Your referral rewards were added.',
          });
        } catch (referralError: any) {
          Toast.show({
            type: 'info',
            text1: 'Account created',
            text2:
              referralError?.message ||
              'We could not apply the referral code. You can redeem it later in Referral screen.',
          });
        }
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <Text className="mb-2 text-2xl font-semibold text-gray-900">Create your MemoPal account</Text>

        <Text className="mb-8 max-w-sm text-center text-gray-600">
          Set up your account to sync your progress and unlock premium features
        </Text>

        <View className="mb-4 w-full max-w-sm gap-3">
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            className="rounded-xl border-2 border-gray-200 px-4 py-3"
            autoCapitalize="words"
          />
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
            placeholder="Password (min 6 chars)"
            secureTextEntry
            className="rounded-xl border-2 border-gray-200 px-4 py-3"
          />
          <TextInput
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Referral code (optional)"
            autoCapitalize="characters"
            className="rounded-xl border-2 border-gray-200 px-4 py-3"
          />
        </View>

        <AnimatedPressable
          onPress={handleRegister}
          disabled={!canSubmit || isSubmitting}
          className={`mb-3 w-full max-w-sm items-center justify-center rounded-xl px-6 py-4 ${!canSubmit || isSubmitting ? 'bg-gray-300' : 'bg-teal-600'}`}>
          <Text className="font-medium text-white">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={async () => {
            if (!socialEnabled) {
              Toast.show({
                type: 'info',
                text1: 'Coming soon',
                text2: 'Google sign-up is temporarily disabled in local test mode.',
              });
              return;
            }
            try {
              setIsSubmitting(true);
              const token = await getGoogleAccessToken();
              await loginWithGoogle(token);
              router.replace('/(tabs)');
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Google login failed',
                text2: error?.message || 'Please try again.',
              });
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="mb-2 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
          <Image
            source={require('../../../assets/images/google-icon.png')}
            style={{ width: 18, height: 18 }}
            contentFit="contain"
          />
          <Text className="font-medium text-slate-700">Continue with Google</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={async () => {
            if (!socialEnabled) {
              Toast.show({
                type: 'info',
                text1: 'Coming soon',
                text2: 'Facebook sign-up is temporarily disabled in local test mode.',
              });
              return;
            }
            try {
              setIsSubmitting(true);
              const token = await getFacebookAccessToken();
              await loginWithFacebook(token);
              router.replace('/(tabs)');
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Facebook login failed',
                text2: error?.message || 'Please try again.',
              });
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="mb-3 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
          <Ionicons name="logo-facebook" size={18} color="#1877F2" />
          <Text className="font-medium text-slate-700">Continue with Facebook</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.replace('/login')} className="mb-4">
          <Text className="text-slate-500">Already have an account? Sign in</Text>
        </AnimatedPressable>
      </View>

      <View className="p-6">
        <Text className="text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
