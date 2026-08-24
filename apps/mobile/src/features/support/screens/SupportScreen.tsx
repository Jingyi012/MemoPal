import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useHelpFaqConfig } from '@/features/support/hooks/useHelpFaqConfig';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Support() {
  const router = useRouter();
  const { config } = useHelpFaqConfig();
  const [subject, setSubject] = useState('MemoPal Support Request');
  const [message, setMessage] = useState('');
  const supportEmail = config.support.email;
  const supportEnabled = config.support.showEmailSupport;
  const supportButtonTitle = config.support.emailButtonTitle || 'Contact Support';

  const handleSend = async () => {
    if (!supportEnabled) {
      Toast.show({
        type: 'info',
        text1: 'Email support unavailable',
        text2: 'Email support is currently disabled.',
      });
      return;
    }

    if (!message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Message required',
        text2: 'Please describe your issue before sending.',
      });
      return;
    }

    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(mailto);

    if (!canOpen) {
      Toast.show({
        type: 'error',
        text1: 'No email app found',
        text2: `Please email ${supportEmail} manually.`,
      });
      return;
    }

    await Linking.openURL(mailto);
  };

  return (
    <View className="flex-1 bg-[#FFFDF8]">
      <CommonHeader title="Support" description={undefined} backAction={() => router.back()} />

      <View className="gap-4 p-5">
        <Text className="text-[#6B6A80]">
          {supportEnabled
            ? `Need help? Send us a message and we'll get back to you at ${supportEmail}.`
            : 'Email support is currently disabled.'}
        </Text>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Subject"
          className="rounded-2xl border-2 border-[#EEE9DC] bg-white px-4 py-3"
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          className="rounded-2xl border-2 border-[#EEE9DC] bg-white px-4 py-3"
        />

        <AnimatedPressable
          onPress={handleSend}
          disabled={!supportEnabled}
          className={`items-center rounded-2xl py-4 ${supportEnabled ? 'bg-[#FFC93C]' : 'bg-[#D8D4C9]'}`}>
          <Text className={`font-semibold ${supportEnabled ? 'text-[#2B2A3D]' : 'text-[#9A97A7]'}`}>{supportButtonTitle}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
