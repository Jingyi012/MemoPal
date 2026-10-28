import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { LearningButton, useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningPracticeTip({ userId }: { userId: string }) {
  const { styles } = useLearningStyles(); const copy = useLearningCopy();
  const key = `memopal.education.practice-tip.v1:${userId}`;
  const [visible, setVisible] = useState(false);
  useEffect(() => { let active = true; setVisible(false); void AsyncStorage.getItem(key).then(value => { if (active) setVisible(value !== 'seen'); }).catch(() => { if (active) setVisible(true); }); return () => { active = false; }; }, [key]);
  if (!visible) return null;
  return <View style={styles.card}><Text style={styles.body}>{copy.tip}</Text><LearningButton secondary label={copy.gotIt} onPress={() => { setVisible(false); void AsyncStorage.setItem(key, 'seen').catch(() => undefined); }} /></View>;
}
