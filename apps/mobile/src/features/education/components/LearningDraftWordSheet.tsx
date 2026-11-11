import { AppText as Text } from '@/components/ui/AppText';
import { AppSheetTextInput } from '@/components/AppSheetTextInput';
import { forwardRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { useLearningCopy } from './LearningUi';
import { useDraftStyles } from './learningDraftStyles';
import type { DraftUnit } from '../utils/educationDraftEditor';

export type EditingDraftWord = { id: string; text: string; meaning: string; unitId: string };
export const LearningDraftWordSheet = forwardRef<BottomSheetModal, {
  word: EditingDraftWord | null; units: DraftUnit[]; error: string; onChange: (word: EditingDraftWord) => void;
  onNewUnit: () => void; onSave: () => void; onDelete: () => void;
}>(function LearningDraftWordSheet({ word, units, error, onChange, onNewUnit, onSave, onDelete }, ref) {
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  const insets = useSafeAreaInsets();
  return <CustomBottomSheetModal ref={ref} snapPoints={['75%', '95%']} enableDynamicSizing={false} keyboardBehavior="interactive" keyboardBlurBehavior="restore">
    <BottomSheetScrollView keyboardShouldPersistTaps="handled" accessibilityViewIsModal contentContainerStyle={[s.content, { paddingBottom: Math.max(20, insets.bottom) }]}>
      {word ? <>
        <Text accessibilityRole="header" style={s.title}>{zh ? '编辑词语' : 'Edit word'}</Text>
        <Text style={s.small}>{zh ? '修改词语' : 'Word'}</Text>
        <AppSheetTextInput accessibilityLabel={zh ? '修改词语' : 'Edit word text'} value={word.text} onChangeText={text => onChange({ ...word, text })} maxLength={500} style={s.input} selectionColor={theme.violetDeep} />
        <Text style={s.small}>{zh ? '释义（选填）' : 'Meaning (optional)'}</Text>
        <AppSheetTextInput accessibilityLabel={zh ? '词语释义' : 'Word meaning'} value={word.meaning} onChangeText={meaning => onChange({ ...word, meaning })} maxLength={500} style={s.input} selectionColor={theme.violetDeep} />
        <Text style={s.small}>{zh ? '移动到' : 'Move to'}</Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>{units.map((unit, index) => <AnimatedPressable key={unit.id} accessibilityRole="radio" accessibilityState={{ checked: word.unitId === unit.id }}
          onPress={() => onChange({ ...word, unitId: unit.id })} style={[s.chip, word.unitId === unit.id && s.selectedChip]}>
          <Text style={[s.chipText, word.unitId === unit.id && s.selectedText]}>{unit.title || (zh ? `单元 ${index + 1}` : `Unit ${index + 1}`)}</Text>
        </AnimatedPressable>)}
          <AppButton label={zh ? '＋ 新单元' : '＋ New unit'} variant="tertiary" size="compact" onPress={onNewUnit} />
        </View>
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        <AppButton label={zh ? '保存修改' : 'Save changes'} disabled={!word.text.trim()} onPress={onSave} />
        <AppButton label={zh ? '删除这个词' : 'Delete word'} variant="tertiary" labelStyle={{ color: theme.berryDeep }} onPress={onDelete} />
      </> : null}
    </BottomSheetScrollView>
  </CustomBottomSheetModal>;
});
