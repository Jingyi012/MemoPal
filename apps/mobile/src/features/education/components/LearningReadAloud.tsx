import { useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { educationReadAloud } from '../services/educationReadAloud.service';
import type { ReadingVoiceState } from '../utils/educationReadAloud';
import { useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningReadAloud({ text, language }: { text: string; language: string }) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const focused = useIsFocused();
  const cancel = useRef<(() => void) | undefined>(undefined);
  const [state, setState] = useState<ReadingVoiceState>('idle');
  useEffect(() => {
    const stop = () => { cancel.current?.(); cancel.current = undefined; setState('idle'); };
    stop();
    const subscription = AppState.addEventListener('change', value => { if (value !== 'active') stop(); });
    return () => { subscription.remove(); cancel.current?.(); cancel.current = undefined; };
  }, [focused, text, language]);
  const playing = state === 'loading' || state === 'speaking';
  const label = playing ? (zh ? '停止朗读' : 'Stop reading') : (zh ? '听一听' : 'Listen');
  return <View style={{ gap: 6 }}>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} disabled={!focused}
      onPress={() => {
        cancel.current?.(); cancel.current = undefined;
        if (playing) { setState('idle'); return; }
        cancel.current = educationReadAloud.play(text, language, setState);
      }} style={{ alignSelf: 'flex-start', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, borderRadius: 18, backgroundColor: theme.paper, borderColor: theme.line, borderWidth: 2, borderBottomWidth: 4 }}>
      <Ionicons name={playing ? 'stop-circle-outline' : 'volume-high-outline'} size={24} color={theme.violetDeep} />
      <Text style={[s.small, { color: theme.violetDeep }]}>{label}</Text>
    </AnimatedPressable>
    {state === 'error' ? <Text accessibilityRole="alert" style={[s.small, { color: theme.ink }]}>{zh ? '暂时无法朗读，请检查设备语音设置后重试。' : 'Reading is unavailable. Check your device’s speech settings and retry.'}</Text> : null}
  </View>;
}
