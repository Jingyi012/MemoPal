import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing } from '@/theme/designSystem';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppBottomSheet } from '@/components/AppBottomSheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningIconButton } from './LearningIconButton';
import { useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningChoiceMenu({ value, onChange, options, label, title }: {
  value: string; onChange: (value: string) => void; label?: string; title?: string;
  options: readonly { value: string; label: string; description?: string; count?: number | string }[];
}) {
  const [open, setOpen] = useState(false); const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const selected = options.find(option => option.value === value);
  return <>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${title ?? (zh ? '切换分类' : 'Change category')} · ${selected?.label ?? label}`} accessibilityState={{ expanded: open }}
      onPress={() => setOpen(true)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm, paddingHorizontal: 0, paddingVertical: appSpacing.sm, borderRadius: 10, backgroundColor: 'transparent', alignSelf: 'flex-start', flexShrink: 1 }}>
      <Text style={[s.small, { color: theme.violetDeep, flexShrink: 1 }]}>{label ?? selected?.label}</Text><Ionicons name="chevron-down" size={16} color={theme.violetDeep} />
    </AnimatedPressable>
    <AppBottomSheet height={options.length * 72 + 120} visible={open} onClose={() => setOpen(false)}>
          <View style={s.row}><Text style={[s.heading, { flex: 1 }]}>{title ?? (zh ? '选择分类' : 'Choose a category')}</Text><LearningIconButton variant="plain" icon="close" label={zh ? '关闭' : 'Close'} onPress={() => setOpen(false)} /></View>
          <ScrollView contentContainerStyle={{ gap: appSpacing.sm }}>{options.map(option => <AnimatedPressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: option.value === value }}
            onPress={() => { onChange(option.value); setOpen(false); }} style={[s.row, { minHeight: 60, borderRadius: appRadii.control, padding: 14, backgroundColor: option.value === value ? theme.violetTint : theme.canvas }]}>
            <View style={{ flex: 1, minWidth: 0, gap: appSpacing.xs }}><Text style={s.heading}>{option.label}</Text>{option.description ? <Text style={s.small}>{option.description}</Text> : null}</View>
            {option.count !== undefined ? <Text style={s.small}>{option.count}</Text> : null}{option.value === value ? <Ionicons name="checkmark-circle" size={22} color={theme.violetDeep} /> : null}
          </AnimatedPressable>)}</ScrollView>
    </AppBottomSheet>
  </>;
}
