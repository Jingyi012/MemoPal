import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useHelpFaqConfig } from '@/features/support/hooks/useHelpFaqConfig';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function Support() {
  const router = useRouter();
  const { t } = useTranslation('support');
  const { config } = useHelpFaqConfig();
  const [subject, setSubject] = useState('MemoPal Support Request');
  const [message, setMessage] = useState('');
  const supportEmail = config.support.email;
  const supportEnabled = config.support.showEmailSupport;
  const supportButtonTitle = config.support.emailButtonTitle || t('contactSupport');

  const handleSend = async () => {
    if (!supportEnabled) {
      Toast.show({
        type: 'info',
        text1: t('emailUnavailable'),
        text2: t('emailDisabledBody'),
      });
      return;
    }

    if (!message.trim()) {
      Toast.show({
        type: 'error',
        text1: t('messageRequired'),
        text2: t('messageRequiredBody'),
      });
      return;
    }

    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(mailto);

    if (!canOpen) {
      Toast.show({
        type: 'error',
        text1: t('noEmailApp'),
        text2: `${t('emailManually')} ${supportEmail}.`,
      });
      return;
    }

    await Linking.openURL(mailto);
  };

  return (
    <View className="flex-1 bg-white">
      <CommonHeader title={t('title')} description={undefined} backAction={() => router.back()} />

      <View className="gap-4 p-5">
        <Text className="text-[#6B6A80]">
          {supportEnabled
            ? `${t('needHelp')} ${supportEmail}.`
            : t('emailDisabled')}
        </Text>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t('subject')}
          className="rounded-2xl border-2 border-[#E5DFFF] bg-white px-4 py-3"
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t('describeIssue')}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          className="rounded-2xl border-2 border-[#E5DFFF] bg-white px-4 py-3"
        />

        <AnimatedPressable
          onPress={handleSend}
          disabled={!supportEnabled}
          className={`items-center rounded-2xl py-4 ${supportEnabled ? 'bg-primary' : 'bg-line'}`}>
          <Text className={`font-semibold ${supportEnabled ? 'text-[#2B2A3D]' : 'text-[#9A97A7]'}`}>{supportButtonTitle}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
