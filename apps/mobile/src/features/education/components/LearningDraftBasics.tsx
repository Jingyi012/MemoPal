import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { appRadii, appSpacing } from '@/theme/designSystem';
import { View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDraftStyles } from './learningDraftStyles';
import { useLearningCopy } from './LearningUi';
import type { DraftImportMode } from '../utils/educationDraftEditor';
import type { EducationCourseContentType } from '../api/educationCourseDraft.api';
import { useState } from 'react';

export function LearningDraftBasics({ title, language, mode, meaningLanguage, difficulty, contentType, onTitle, onLanguage, onMode, onMeaningLanguage, onDifficulty, onContentType }: {
  title: string; language: string; mode: DraftImportMode; meaningLanguage: string; difficulty: 'basic' | 'advanced'; contentType: EducationCourseContentType;
  onTitle: (value: string) => void; onLanguage: (value: string) => void; onMode: (value: DraftImportMode) => void;
  onMeaningLanguage: (value: string) => void; onDifficulty: (value: 'basic' | 'advanced') => void; onContentType: (value: EducationCourseContentType) => void;
}) {
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  return <>
    <View style={{ gap: appSpacing.xs }}><Text style={s.title}>{zh ? '你想学什么？' : 'What would you like to learn?'}</Text><Text style={s.small}>{zh ? '先取个名字，再选内容语言' : 'Choose a name and content language'}</Text></View>
    <Text style={s.heading}>{zh ? '学习内容名称' : 'Study content name'}</Text>
    <TextInput accessibilityLabel={zh ? '学习内容名称' : 'Study content name'} value={title} onChangeText={onTitle} maxLength={200}
      placeholder={zh ? '例如：方向、星期五听写' : 'e.g. Directions, Friday spelling'} placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep} style={s.input} />
    <Text style={s.heading}>{zh ? '内容语言' : 'Content language'}</Text>
    <View style={[s.row, { flexWrap: 'wrap' }]}>{[{ code: 'zh-Hans', label: '中文' }, { code: 'en', label: 'English' }, { code: 'ms', label: 'Bahasa Melayu' }].map(item =>
      <AnimatedPressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: language === item.code }} onPress={() => onLanguage(item.code)} style={[s.chip, language === item.code && s.selectedChip]}>
        <Text style={[s.chipText, language === item.code && s.selectedText]}>{language === item.code ? '✓ ' : ''}{item.label}</Text>
      </AnimatedPressable>)}</View>
    <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded: advancedOpen }} onPress={() => setAdvancedOpen(value => !value)} style={[s.row, { minHeight: 44, marginTop: appSpacing.xs }]}>
      <Text style={s.heading}>{zh ? '高级选项' : 'Advanced options'}</Text><Text style={s.chipText}>{advancedOpen ? '−' : '+'}</Text>
    </AnimatedPressable>
    {advancedOpen ? <View style={s.card}>
      <Text style={s.heading}>{zh ? '内容类型' : 'Content type'}</Text>
      <View style={[s.row, { flexWrap: 'wrap' }]}>{([
        { code: 'VocabularyPair', label: zh ? '词语 / 释义' : 'Word / meaning' },
        { code: 'ConceptUnderstanding', label: zh ? '知识点 / 说明' : 'Knowledge point / notes' },
        { code: 'VerbatimText', label: zh ? '短句 / 原文' : 'Short sentence / source text' },
      ] as const).map(item => {
        const selected = contentType === item.code || (item.code === 'VocabularyPair' && contentType === 'LanguageItem');
        return <AnimatedPressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onContentType(item.code)} style={[s.chip, selected && s.selectedChip]}>
          <Text style={[s.chipText, selected && s.selectedText]}>{item.label}</Text>
        </AnimatedPressable>;
      })}</View>
      <Text style={s.small}>{zh ? '根据你提供的内容准备合适练习，生成后可以预览和修改。' : 'Practice is prepared from the content you provide. Preview and edit it before saving.'}</Text>
      <Text style={s.heading}>{zh ? '意思语言' : 'Meaning language'}</Text>
      <View style={[s.row, { flexWrap: 'wrap' }]}>{[{ code: 'zh-Hans', label: '中文' }, { code: 'en', label: 'English' }, { code: 'ms', label: 'Bahasa Melayu' }].map(item =>
        <AnimatedPressable key={`meaning-${item.code}`} accessibilityRole="radio" accessibilityState={{ checked: meaningLanguage === item.code }} onPress={() => onMeaningLanguage(item.code)} style={[s.chip, meaningLanguage === item.code && s.selectedChip]}>
          <Text style={[s.chipText, meaningLanguage === item.code && s.selectedText]}>{item.label}</Text>
        </AnimatedPressable>)}</View>
      <Text style={s.heading}>{zh ? '难度' : 'Difficulty'}</Text>
      <View style={[s.row, { flexWrap: 'wrap' }]}>{([{ code: 'basic', label: zh ? '基础' : 'Basic' }, { code: 'advanced', label: zh ? '进阶' : 'Advanced' }] as const).map(item =>
        <AnimatedPressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: difficulty === item.code }} onPress={() => onDifficulty(item.code)} style={[s.chip, difficulty === item.code && s.selectedChip]}>
          <Text style={[s.chipText, difficulty === item.code && s.selectedText]}>{item.label}</Text>
        </AnimatedPressable>)}</View>
    </View> : null}
    <Text style={[s.heading, { marginTop: appSpacing.sm }]}>{zh ? '想怎么添加内容？' : 'How will you add content?'}</Text>
    {([{ key: 'manual', icon: 'text-outline', title: zh ? '手动输入' : 'Type entries', detail: zh ? '一个一个输入，按回车添加' : 'Type an entry and press enter' },
      { key: 'paste', icon: 'clipboard-outline', title: zh ? '粘贴多行' : 'Paste a list', detail: zh ? '一次粘贴一整列内容' : 'Paste one entry per line' },
      { key: 'scan', icon: 'scan-outline', title: zh ? '扫描照片' : 'Scan a photo', detail: zh ? '拍下课本或学习资料' : 'Photograph a textbook or study notes' }] as const).map(item =>
      <AnimatedPressable key={item.key} accessibilityRole="radio" accessibilityState={{ checked: mode === item.key }} onPress={() => onMode(item.key)}
        style={[s.card, s.row, mode === item.key && { borderColor: theme.violetDeep }]}>
        <View style={{ width: 40, height: 40, borderRadius: appRadii.control, backgroundColor: theme.violetTint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.icon} size={22} color={theme.violetDeep} /></View>
        <View style={{ flex: 1, gap: 3 }}><Text style={s.heading}>{item.title}</Text><Text style={s.small}>{item.detail}</Text></View>
        {mode === item.key ? <Text style={s.chipText}>✓</Text> : null}
      </AnimatedPressable>)}
  </>;
}
