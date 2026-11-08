import { LearningIconButton } from './LearningIconButton';
import type { ComponentProps } from 'react';
import type { CommonHeader } from '@/components/CommonHeader';
import AnimatedPressable from '@/components/AnimatedPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAiCredits } from '@/features/ai-credits/hooks/useAiCredits';
import { learningTypography as typography } from '../theme/learningTheme';
import { useLearningStyles } from './LearningUi';

export function LearningHeader({ title, description, actions = [], hideBackButton, backAction, leftComponent, showAiCredits = true, additionalContent }: ComponentProps<typeof CommonHeader>) {
  const { theme } = useLearningStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const balance = useAiCredits();
  const available = balance.data?.available;
  const balanceText = available === undefined ? '…' : available >= 1000 ? `${Math.floor(available / 1000)}k` : available;
  return <View style={{ backgroundColor: theme.canvas, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44 }}>
      {!hideBackButton ? leftComponent ?? <LearningIconButton icon="chevron-back" label="Go back" onPress={backAction ?? (() => router.back())} /> : null}
      <Text accessibilityRole="header" numberOfLines={1} style={{ color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: hideBackButton ? 26 : 18, flex: 1, minWidth: 0 }}>{title}</Text>
      {actions.map((action, index) => action.component ? <View key={index}>{action.component}</View> : action.icon ? <AnimatedPressable key={index} accessibilityLabel={action.accessibilityLabel ?? title} onPress={action.onPress} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><action.icon size={22} color={theme.ink} /></AnimatedPressable> : null)}
      {showAiCredits ? <AnimatedPressable accessibilityLabel="AI credits" onPress={() => router.push('/ai-credits')} style={{ borderColor: theme.line, borderWidth: 2, borderRadius: 16, minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.violetTint }}><Ionicons name="sparkles" size={15} color={theme.violetDeep} /><Text style={{ color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 }}>AI {balanceText}</Text></AnimatedPressable> : null}
    </View>
    {description ? <Text style={{ color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 13 }}>{description}</Text> : null}
    {additionalContent}
  </View>;
}
