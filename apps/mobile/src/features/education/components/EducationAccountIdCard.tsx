import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type CopyState = 'copied' | 'error' | null;

export function EducationAccountIdCard({ accountId }: Readonly<{ accountId: string }>) {
  const copy = useEducationCopy();
  const { styles } = useStyles();
  const [copyState, setCopyState] = useState<CopyState>(null);

  const copyAccountId = async () => {
    try {
      await Clipboard.setStringAsync(accountId);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return <View style={styles.card}>
    <View style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{copy.accountIdTitle}</Text>
      <Text style={styles.accountId} selectable>{accountId}</Text>
      <Text style={styles.description}>{copy.accountIdDescription}</Text>
      {copyState === 'error' ? <Text accessibilityRole="alert" style={styles.error}>{copy.accountIdCopyError}</Text> : null}
    </View>
    <AnimatedPressable accessibilityRole="button" onPress={() => { void copyAccountId(); }} style={styles.action}>
      <Text style={styles.actionText}>{copyState === 'copied' ? copy.accountIdCopied : copy.copyAccountId}</Text>
    </AnimatedPressable>
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.violetTint, borderColor: theme.line, borderRadius: 22, borderWidth: 2, gap: 10, padding: 14 },
  content: { gap: 5 },
  title: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  accountId: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 14, lineHeight: 21 },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 21 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 16, borderBottomWidth: 4, borderColor: theme.primaryShadow, paddingVertical: 10, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 14, lineHeight: 21 },
}));
