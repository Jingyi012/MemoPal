import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLearningCopy, useLearningStyles } from './LearningUi';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';

const shownTips = new Set<string>();

export function LearningPracticeTip({ userId }: { userId: string }) {
  const { styles, theme } = useLearningStyles(); const copy = useLearningCopy();
  const key = `memopal.education.practice-tip.v1:${userId}`;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    setVisible(false);
    const showOnce = () => {
      if (!active || shownTips.has(key)) return;
      shownTips.add(key);
      setVisible(true);
      void AsyncStorage.setItem(key, 'seen').catch(() => undefined);
    };
    if (!shownTips.has(key)) {
      void AsyncStorage.getItem(key).then(value => {
        if (value !== 'seen') showOnce();
      }).catch(showOnce);
    }
    return () => { active = false; };
  }, [key]);
  if (!visible) return null;
  return <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
    <Ionicons name="information-circle-outline" size={20} color={theme.violetDeep} />
    <Text style={[styles.small, { flex: 1 }]}>{copy.zh ? '按自己的节奏练习' : 'Learn at your own pace'}</Text>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={() => { setVisible(false); void AsyncStorage.setItem(key, 'seen').catch(() => undefined); }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="close" size={20} color={theme.inkSoft} />
    </AnimatedPressable>
  </View>;
}
