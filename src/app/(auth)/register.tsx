import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useAuth } from '@/contexts/AuthProvider';
import { getFacebookAccessToken, getGoogleAccessToken } from '@/services/socialAuth.service';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';

export default function Register() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title="Create account"
        description={undefined}
        hideBackButton={false}
        backAction={() => router.back()}
      />

      <View className="gap-4 p-5">
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          className="rounded-xl border border-slate-200 px-4 py-3"
          autoCapitalize="words"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          className="rounded-xl border border-slate-200 px-4 py-3"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 6 chars)"
          secureTextEntry
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <AnimatedPressable
          onPress={handleRegister}
          disabled={!canSubmit || isSubmitting}
          className={`items-center rounded-xl py-4 ${!canSubmit || isSubmitting ? 'bg-slate-300' : 'bg-teal-600'}`}>
          <Text className="font-semibold text-white">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={async () => {
            if (!socialEnabled) return Alert.alert('Coming soon', 'Google sign-up is temporarily disabled in local test mode.');
            try {
              setIsSubmitting(true);
              const token = await getGoogleAccessToken();
              await loginWithGoogle(token);
              router.replace('/(tabs)');
            } catch (error: any) {
              Alert.alert('Google login failed', error?.message || 'Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="items-center rounded-xl border border-slate-200 bg-white py-3">
          <Text className="font-semibold text-slate-700">Continue with Google</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={async () => {
            if (!socialEnabled) return Alert.alert('Coming soon', 'Facebook sign-up is temporarily disabled in local test mode.');
            try {
              setIsSubmitting(true);
              const token = await getFacebookAccessToken();
              await loginWithFacebook(token);
              router.replace('/(tabs)');
            } catch (error: any) {
              Alert.alert('Facebook login failed', error?.message || 'Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="items-center rounded-xl border border-slate-200 bg-white py-3">
          <Text className="font-semibold text-slate-700">Continue with Facebook</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.replace('/login')} className="items-center py-2">
          <Text className="text-slate-500">Already have an account? Sign in</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
