import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useHelpFaqConfig } from '@/features/support/hooks/useHelpFaqConfig';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function Support() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('support');
  const { config } = useHelpFaqConfig();
  const [subject, setSubject] = useState(() => t('defaultSubject'));
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
    <View style={styles.page}>
      <CommonHeader title={t('title')} description={undefined} backAction={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>💬</Text></View>
          <Text style={styles.heroTitle}>{t('stillNeedHelp')}</Text>
          <Text style={styles.heroBody}>
          {supportEnabled
            ? `${t('needHelp')} ${supportEmail}.`
            : t('emailDisabled')}
          </Text>
        </View>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t('subject')}
          placeholderTextColor={theme.inkSoft}
          style={styles.input}
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t('describeIssue')}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor={theme.inkSoft}
          style={[styles.input, styles.messageInput]}
        />

        <AnimatedPressable
          onPress={handleSend}
          disabled={!supportEnabled}
          style={[styles.sendButton, !supportEnabled && styles.sendButtonDisabled]}>
          <Text style={[styles.sendText, !supportEnabled && styles.sendTextDisabled]}>{supportButtonTitle}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 14, padding: 20 },
  hero: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 24, borderWidth: 1.5, padding: 20 },
  heroIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  heroEmoji: { fontSize: 34 },
  heroTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20, marginTop: 10 },
  heroBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' },
  input: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1.5, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14, minHeight: 52, paddingHorizontal: 14 },
  messageInput: { minHeight: 140, paddingBottom: 12, paddingTop: 12, textAlignVertical: 'top' },
  sendButton: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 16, minHeight: 52, justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: theme.line },
  sendText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  sendTextDisabled: { color: theme.inkMuted },
}));
