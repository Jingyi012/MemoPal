import { useState } from 'react';
import { Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { AppBottomSheet } from '@/components/AppBottomSheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningIconButton } from './LearningIconButton';
import { useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningWorkspaceActions({ memory = false }: { memory?: boolean }) {
  const router = useRouter(); const { zh } = useLearningCopy(); const { styles: s, theme } = useLearningStyles();
  const [open, setOpen] = useState(false);
  return <View style={[s.row, { gap: 4 }]}>
    {memory ? <AnimatedPressable accessibilityLabel={zh ? '记忆方法：宫殿与数字挂钩' : 'Memory methods: palaces and number pegs'} accessibilityRole="button" onPress={() => router.push('/memory-tools' as Href)} style={{ minHeight: 44, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name="shapes-outline" size={19} color={theme.violetDeep} /><Text style={[s.small, { color: theme.violetDeep }]}>{zh ? '记忆方法' : 'Methods'}</Text>
    </AnimatedPressable> : null}
    <LearningIconButton icon="add" label={zh ? '新建学习或记忆内容' : 'Create study or memory content'} onPress={() => setOpen(true)} />
    <AppBottomSheet visible={open} onClose={() => setOpen(false)}>
          <View style={s.row}><Text style={[s.title, { flex: 1 }]}>{zh ? '今天想学点什么？' : 'What will you learn today?'}</Text><LearningIconButton icon="close" variant="plain" label={zh ? '关闭' : 'Close'} onPress={() => setOpen(false)} /></View>
          {[{ route: '/education/create-course', icon: 'book-outline' as const, title: zh ? '学习内容' : 'Study content', body: zh ? '词表、听写、自己的学习卡片' : 'Word lists, spelling and your study cards' },
            { route: '/create-memory', icon: 'bulb-outline' as const, title: zh ? '记忆练习' : 'Memory practice', body: zh ? '用宫殿或数字挂钩帮助记忆' : 'Remember with a palace or number pegs' }].map(item =>
            <AnimatedPressable key={item.route} accessibilityRole="button" onPress={() => { setOpen(false); router.push(item.route as Href); }} style={[s.card, s.row]}>
              <View style={{ padding: 12, borderRadius: 16, backgroundColor: theme.violetTint }}><Ionicons name={item.icon} size={27} color={theme.violetDeep} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>{item.title}</Text><Text style={s.small}>{item.body}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.violetDeep} />
            </AnimatedPressable>)}
    </AppBottomSheet>
  </View>;
}
