import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { Plus, ScanText, ClipboardList, Trash2 } from '@/core/icons';
import { useLearningCopy } from './LearningUi';
import { useDraftStyles } from './learningDraftStyles';
import type { DraftImportMode, DraftUnit, DraftWord } from '../utils/educationDraftEditor';

export function LearningDraftUnits({ units, inputs, mode, activeId, onInput, onAdd, onScan, onRename, onWord, onNew, onRemove, onReveal }: {
  units: DraftUnit[]; inputs: Record<string, string>; mode: DraftImportMode; activeId: string;
  onInput: (id: string, value: string) => void; onAdd: (id: string) => void; onScan: (id: string) => void;
  onRename: (id: string, value: string) => void; onWord: (word: DraftWord, unitId: string) => void;
  onNew: () => void; onRemove: (id: string) => void;
  onReveal: (offset: number) => void;
}) {
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  const [bulkId, setBulkId] = useState<string | null>(mode === 'paste' ? activeId : null);
  const revealedId = useRef<string | null>(null);
  return <>
    {units.map((unit, index) => <View key={unit.id} style={s.card} onLayout={event => {
      if (unit.id === activeId && revealedId.current !== activeId) {
        revealedId.current = activeId;
        if (index > 0) onReveal(event.nativeEvent.layout.y);
      }
    }}>
      <View style={s.row}>
        <Text style={s.badge}>{index + 1}</Text>
        <TextInput accessibilityLabel={zh ? `单元 ${index + 1} 名称` : `Unit ${index + 1} name`} value={unit.title}
          onChangeText={value => onRename(unit.id, value)} maxLength={200} placeholder={zh ? '单元名称' : 'Unit name'}
          placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep} style={[s.heading, { flex: 1, minWidth: 0, minHeight: 44 }]} />
        <Text style={s.badge}>{unit.words.length} {zh ? '个词' : 'words'}</Text>
        {units.length > 1 ? <AppButton icon={Trash2} variant="tertiary" size="compact" accessibilityLabel={zh ? '删除这个单元' : 'Delete this unit'} onPress={() => onRemove(unit.id)} /> : null}
      </View>
      <View style={[s.row, { flexWrap: 'wrap' }]}>{unit.words.map(word => <AnimatedPressable key={word.id} accessibilityRole="button"
        accessibilityLabel={zh ? `编辑 ${word.text}` : `Edit ${word.text}`} onPress={() => onWord(word, unit.id)} style={s.chip}>
        <Text style={s.chipText}>{word.text}</Text>
      </AnimatedPressable>)}</View>
      <View style={[s.row, { alignItems: 'flex-start' }]}>
        <TextInput accessibilityLabel={zh ? `给单元 ${index + 1} 添加词语` : `Add words to unit ${index + 1}`} value={inputs[unit.id] ?? ''}
          onChangeText={value => onInput(unit.id, value)} multiline={bulkId === unit.id} maxLength={52000}
          onSubmitEditing={bulkId === unit.id ? undefined : () => onAdd(unit.id)} returnKeyType="done"
          placeholder={bulkId === unit.id ? (zh ? '每行一个词，可粘贴词语和释义两列' : 'One word per line; paste word + meaning columns') : (zh ? '输入词语，按回车添加' : 'Type a word and press enter')}
          placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep}
          style={[s.input, { flex: 1, minWidth: 0 }, bulkId === unit.id && { minHeight: 110, textAlignVertical: 'top' }]} />
        <AppButton icon={Plus} accessibilityLabel={zh ? '添加输入的词语' : 'Add entered words'} size="compact" disabled={!inputs[unit.id]?.trim()} onPress={() => onAdd(unit.id)} />
      </View>
      <View style={[s.row, { justifyContent: 'flex-end' }]}>
        <AppButton label={zh ? '粘贴多行' : 'Paste list'} icon={ClipboardList} variant="tertiary" size="compact" onPress={() => setBulkId(bulkId === unit.id ? null : unit.id)} />
        <AppButton icon={ScanText} accessibilityLabel={zh ? '扫描到这个单元' : 'Scan into this unit'} variant="secondary" size="compact" onPress={() => onScan(unit.id)} />
      </View>
    </View>)}
    <AnimatedPressable accessibilityRole="button" onPress={onNew} style={s.dashed}><Text style={s.chipText}>＋ {zh ? '新增单元' : 'Add unit'}</Text></AnimatedPressable>
    <Text style={s.small}>{zh ? '按内容分单元，想一起学的词放在同一个单元。' : 'Keep words you want to study together in the same unit.'}</Text>
  </>;
}
