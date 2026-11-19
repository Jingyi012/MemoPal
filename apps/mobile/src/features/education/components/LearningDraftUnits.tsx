import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { Plus, ScanText, ClipboardList, Trash2 } from '@/core/icons';
import { useLearningCopy } from './LearningUi';
import { useDraftStyles } from './learningDraftStyles';
import type { DraftImportMode, DraftUnit, DraftWord } from '../utils/educationDraftEditor';
import type { EducationCourseContentType } from '../api/educationCourseDraft.api';
import { parseEducationStudyList } from '../utils/educationStudyList';

export function LearningDraftUnits({ units, inputs, mode, activeId, contentType = 'LanguageItem', onInput, onAdd, onScan, onRename, onWord, onMeaning, onNew, onRemove, onReveal }: {
  units: DraftUnit[]; inputs: Record<string, string>; mode: DraftImportMode; activeId: string; contentType?: EducationCourseContentType;
  onInput: (id: string, value: string) => void; onAdd: (id: string) => void; onScan: (id: string) => void;
  onRename: (id: string, value: string) => void; onWord: (word: DraftWord, unitId: string) => void;
  onMeaning: (wordId: string, value: string) => void;
  onNew: () => void; onRemove: (id: string) => void;
  onReveal: (offset: number) => void;
}) {
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  const [bulkId, setBulkId] = useState<string | null>(mode !== 'manual' ? activeId : null);
  const revealedId = useRef<string | null>(null);
  const zhLabel = contentType === 'ConceptUnderstanding' ? '知识点' : contentType === 'VerbatimText' ? '短句' : '词语';
  const enLabel = contentType === 'ConceptUnderstanding' ? 'Concept' : contentType === 'VerbatimText' ? 'Sentence' : 'Word';
  const zhMeaningLabel = contentType === 'ConceptUnderstanding' ? '说明' : contentType === 'VerbatimText' ? '提示 / 来源说明' : '意思 / 提示';
  const enMeaningLabel = contentType === 'ConceptUnderstanding' ? 'Notes / explanation' : contentType === 'VerbatimText' ? 'Clue / source note' : 'Meaning / clue';
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
        <Text style={s.badge}>{unit.words.length} {zh ? '个条目' : 'entries'}</Text>
        {units.length > 1 ? <AppButton icon={Trash2} variant="tertiary" size="compact" accessibilityLabel={zh ? '删除这个单元' : 'Delete this unit'} onPress={() => onRemove(unit.id)} /> : null}
      </View>
      {unit.words.length > 12 ? <View style={s.note}>
        {unit.words.map(word => <AnimatedPressable key={word.id} accessibilityRole="button" accessibilityLabel={zh ? `编辑 ${word.text} 的意思` : `Edit meaning for ${word.text}`} onPress={() => onWord(word, unit.id)} style={[s.row, { minHeight: 44 }]}>
          <Text numberOfLines={1} style={[s.body, { flex: 1 }]}>{word.text}</Text>
          <Text numberOfLines={1} style={[s.small, { flex: 1 }]}>{word.meaning?.trim() || (zh ? `添加${zhMeaningLabel}` : `Add ${enMeaningLabel.toLowerCase()}`)}</Text>
          <Text style={s.chipText}>{zh ? '编辑' : 'Edit'}</Text>
        </AnimatedPressable>)}
      </View> : unit.words.map(word => <View key={word.id} style={s.wordRow}>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={zh ? `编辑或移动 ${word.text}` : `Edit or move ${word.text}`} onPress={() => onWord(word, unit.id)} style={s.wordHeading}>
          <Text style={[s.heading, { flex: 1 }]}>{word.text}</Text><Text style={s.chipText}>{zh ? '编辑' : 'Edit'}</Text>
        </AnimatedPressable>
        <Text style={s.small}>{zh ? `${zhMeaningLabel}（选填）` : `${enMeaningLabel} (optional)`}</Text>
        <TextInput accessibilityLabel={zh ? `${word.text} 的意思或提示` : `Meaning or clue for ${word.text}`} value={word.meaning ?? ''}
          onChangeText={value => onMeaning(word.id, value)} maxLength={500} multiline
          placeholder={zh ? (contentType === 'ConceptUnderstanding' ? '例如：种子萌发不需要土壤。' : contentType === 'VerbatimText' ? '提供提示，帮助还原原句' : '例如 school → 学校') : (contentType === 'ConceptUnderstanding' ? 'For example: Seeds do not need soil to germinate.' : contentType === 'VerbatimText' ? 'Add a clue for restoring the original sentence' : 'For example, school → a place to learn')}
          placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep} style={s.input} />
      </View>)}
      <View style={[s.row, { alignItems: 'flex-start' }]}>
        <TextInput accessibilityLabel={zh ? `给单元 ${index + 1} 添加${zhLabel}` : `Add ${enLabel.toLowerCase()} entries to unit ${index + 1}`} value={inputs[unit.id] ?? ''}
          onChangeText={value => onInput(unit.id, value)} multiline={bulkId === unit.id} maxLength={52000}
          onSubmitEditing={bulkId === unit.id ? undefined : () => onAdd(unit.id)} returnKeyType="done"
          placeholder={bulkId === unit.id ? (zh ? `每行一条，例如：\n${contentType === 'ConceptUnderstanding' ? '种子萌发 = 种子萌发不需要土壤。\n蒸发 = 液态水受热变成水蒸气。' : contentType === 'VerbatimText' ? 'Plants need sunlight to grow = 光合作用提示' : 'school = 学校\nsun = 太阳'}` : `One entry per line, for example:\n${contentType === 'ConceptUnderstanding' ? 'Seed germination = Seeds do not need soil to germinate.\nEvaporation = Liquid water changes into vapor.' : contentType === 'VerbatimText' ? 'Plants need sunlight to grow = A note that helps recall the original sentence' : 'school = a place to learn\nsun = the star that lights Earth'}`) : (zh ? `输入${zhLabel}，或 ${contentType === 'VerbatimText' ? 'Plants need sunlight to grow = 提示' : 'school = 学校'}` : `Type a ${enLabel.toLowerCase()}, or ${contentType === 'VerbatimText' ? 'Plants need sunlight to grow = clue' : 'school = a place to learn'}`)}
          placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep}
          style={[s.input, { flex: 1, minWidth: 0 }, bulkId === unit.id && { minHeight: 110, textAlignVertical: 'top' }]} />
        {bulkId !== unit.id ? <AppButton icon={Plus} accessibilityLabel={zh ? '添加输入的词语' : 'Add entered words'} size="compact" disabled={!inputs[unit.id]?.trim()} onPress={() => onAdd(unit.id)} /> : null}
      </View>
      {inputs[unit.id]?.trim() ? <View style={s.note}>
        <Text style={s.chipText}>{zh ? '加入前确认' : 'Check before adding'}</Text>
        {parseEducationStudyList(inputs[unit.id]).slice(0, 50).map((entry, position) => <View key={position} style={s.row}>
          <Text style={[s.body, { flex: 1 }]}>{entry.text}</Text>
          <Text style={[s.small, { flex: 1 }]}>{entry.meaning || (zh ? `未填${zhMeaningLabel} · 加入后可补充` : `No ${enMeaningLabel.toLowerCase()} · add it later`)}</Text>
        </View>)}
        {bulkId === unit.id ? <AppButton label={zh ? '确认加入单元' : 'Add to unit'} size="compact" onPress={() => onAdd(unit.id)} /> : null}
      </View> : null}
      <View style={[s.row, { justifyContent: 'flex-end' }]}>
        <AppButton label={zh ? '粘贴多行' : 'Paste list'} icon={ClipboardList} variant="tertiary" size="compact" onPress={() => setBulkId(bulkId === unit.id ? null : unit.id)} />
        <AppButton icon={ScanText} accessibilityLabel={zh ? '扫描到这个单元' : 'Scan into this unit'} variant="secondary" size="compact" onPress={() => onScan(unit.id)} />
      </View>
    </View>)}
    <AnimatedPressable accessibilityRole="button" onPress={onNew} style={s.dashed}><Text style={s.chipText}>＋ {zh ? '新增单元' : 'Add unit'}</Text></AnimatedPressable>
    <Text style={s.small}>{zh ? '可稍后补充说明或提示。AI 准备完成后，可预览答案、编辑内容并移除不需要的练习。' : 'Notes and clues can be added later. After preparation, preview answers, edit content, and remove questions you do not need.'}</Text>
  </>;
}
