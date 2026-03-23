import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Support() {
  const router = useRouter();
  const [subject, setSubject] = useState('MemoPal Support Request');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Message required',
        text2: 'Please describe your issue before sending.',
      });
      return;
    }

    const mailto = `mailto:support@memopal.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(mailto);

    if (!canOpen) {
      Toast.show({
        type: 'error',
        text1: 'No email app found',
        text2: 'Please email support@memopal.com manually.',
      });
      return;
    }

    await Linking.openURL(mailto);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <CommonHeader title="Support" description={undefined} backAction={() => router.back()} />

      <View className="gap-4 p-5">
        <Text className="text-slate-600">Need help? Send us a message and we’ll get back to you.</Text>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Subject"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
        />

        <AnimatedPressable onPress={handleSend} className="items-center rounded-xl bg-teal-600 py-4">
          <Text className="font-semibold text-white">Contact Support</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
