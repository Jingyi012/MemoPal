import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

export function AuthLayout({ children, terms }: { children: ReactNode; terms: string }) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>{children}</View>
        <Text style={styles.terms}>{terms}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: appSpacing.xxl },
  form: { width: '100%', maxWidth: 400, alignItems: 'stretch' },
  terms: { maxWidth: 360, color: theme.inkSoft, fontFamily: typography.body, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, textAlign: 'center', marginTop: appSpacing.xxl },
}));
