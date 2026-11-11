import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing } from '@/theme/designSystem';
import { forwardRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { AppButton } from '@/components/ui/AppButton';
import { LearningIconButton } from './LearningIconButton';
import { useLearningCopy, useLearningStyles } from './LearningUi';

export const LearningContentHelpSheet = forwardRef<BottomSheetModal, { onClose: () => void }>(function LearningContentHelpSheet({ onClose }, ref) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const insets = useSafeAreaInsets();
  const steps = zh ? [
    ['取个名称', '例如「星期五听写」，方便以后找到。'],
    ['按单元加入词语', '输入、粘贴或扫描照片。点词语可修改或移动，新增单元可自由分组。总共最多 50 个词。'],
    ['预览并保存', '长按单元或用上下箭头调整顺序。保存后直接开始学习，只有自己能看到；也可以暂存草稿，稍后继续。'],
  ] : [
    ['Name your content', 'For example, “Friday spelling”, so it is easy to find.'],
    ['Add words by unit', 'Type, paste or scan. Tap a word to edit or move it; add units to group your content. Up to 50 words in total.'],
    ['Preview and save', 'Hold units or use the arrows to reorder them. Save and start learning privately, or keep a draft for later.'],
  ];
  return <CustomBottomSheetModal ref={ref} snapPoints={['85%']} enableDynamicSizing={false}>
    <BottomSheetScrollView accessibilityViewIsModal contentContainerStyle={{ padding: appSpacing.xl, paddingBottom: Math.max(20, insets.bottom), gap: appSpacing.xl }}>
      <View style={[s.row, { gap: appSpacing.sm }]}>
        <Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>{zh ? '如何创建学习内容？' : 'How does this work?'}</Text>
        <LearningIconButton icon="close" label={zh ? '关闭说明' : 'Close help'} onPress={onClose} />
      </View>
      {steps.map(([title, description], index) => <View key={title} style={{ flexDirection: 'row', gap: appSpacing.md }}>
        <View style={{ width: 32, height: 32, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint }}>
          <Text style={[s.small, { color: theme.violetDeep }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, gap: appSpacing.xs }}><Text style={s.heading}>{title}</Text><Text style={s.small}>{description}</Text></View>
      </View>)}
      <View style={[s.card, { backgroundColor: theme.violetTint, gap: appSpacing.sm }]}>
        <Text style={s.small}>{zh ? '只有词语 → 学习卡片\n词语 + 释义 → 卡片和文字回忆题' : 'Words → study cards\nWords + meanings → cards and written recall questions'}</Text>
        <Text style={s.small}>{zh ? '可粘贴表格中的两列。暂不自动生成听写或口语评分题。' : 'Paste two columns from a table. Dictation and speech-scoring questions are not generated.'}</Text>
      </View>
      <AppButton label={zh ? '明白了' : 'Got it'} onPress={onClose} />
    </BottomSheetScrollView>
  </CustomBottomSheetModal>;
});
