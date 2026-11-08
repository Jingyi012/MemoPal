import { Text, TextInput, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDraftStyles } from './learningDraftStyles';
import { useLearningCopy } from './LearningUi';
import type { DraftImportMode } from '../utils/educationDraftEditor';

export function LearningDraftBasics({ title, language, mode, onTitle, onLanguage, onMode }: {
  title: string; language: string; mode: DraftImportMode;
  onTitle: (value: string) => void; onLanguage: (value: string) => void; onMode: (value: DraftImportMode) => void;
}) {
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  return <>
    <View style={{ gap: 4 }}><Text style={s.title}>{zh ? '你想学什么？' : 'What would you like to learn?'}</Text><Text style={s.small}>{zh ? '先取个名字，再选内容语言' : 'Choose a name and content language'}</Text></View>
    <Text style={s.heading}>{zh ? '学习内容名称' : 'Study content name'}</Text>
    <TextInput accessibilityLabel={zh ? '学习内容名称' : 'Study content name'} value={title} onChangeText={onTitle} maxLength={200}
      placeholder={zh ? '例如：方向、星期五听写' : 'e.g. Directions, Friday spelling'} placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep} style={s.input} />
    <Text style={s.heading}>{zh ? '内容语言' : 'Content language'}</Text>
    <View style={[s.row, { flexWrap: 'wrap' }]}>{[{ code: 'zh-Hans', label: '中文' }, { code: 'en', label: 'English' }, { code: 'ms', label: 'Bahasa Melayu' }].map(item =>
      <AnimatedPressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: language === item.code }} onPress={() => onLanguage(item.code)} style={[s.chip, language === item.code && s.selectedChip]}>
        <Text style={[s.chipText, language === item.code && s.selectedText]}>{language === item.code ? '✓ ' : ''}{item.label}</Text>
      </AnimatedPressable>)}</View>
    <Text style={[s.heading, { marginTop: 8 }]}>{zh ? '想怎么添加词语？' : 'How will you add words?'}</Text>
    {([{ key: 'manual', icon: 'text-outline', title: zh ? '手动输入' : 'Type words', detail: zh ? '一个一个输入，按回车添加' : 'Type a word and press enter' },
      { key: 'paste', icon: 'clipboard-outline', title: zh ? '粘贴多行' : 'Paste a list', detail: zh ? '一次粘贴一整列词语' : 'Paste one word per line' },
      { key: 'scan', icon: 'scan-outline', title: zh ? '扫描照片' : 'Scan a photo', detail: zh ? '拍下课本或单词表' : 'Photograph a textbook or word list' }] as const).map(item =>
      <AnimatedPressable key={item.key} accessibilityRole="radio" accessibilityState={{ checked: mode === item.key }} onPress={() => onMode(item.key)}
        style={[s.card, s.row, mode === item.key && { borderColor: theme.violetDeep }]}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.violetTint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.icon} size={22} color={theme.violetDeep} /></View>
        <View style={{ flex: 1, gap: 3 }}><Text style={s.heading}>{item.title}</Text><Text style={s.small}>{item.detail}</Text></View>
        {mode === item.key ? <Text style={s.chipText}>✓</Text> : null}
      </AnimatedPressable>)}
  </>;
}
