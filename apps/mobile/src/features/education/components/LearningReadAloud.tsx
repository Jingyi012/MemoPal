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
  return <View style={{ gap: 6, alignItems: 'flex-end', flexShrink: 1 }}>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !focused, busy: state === 'loading' }} disabled={!focused}
      onPress={() => {
        cancel.current?.(); cancel.current = undefined;
        if (playing) { setState('idle'); return; }
        cancel.current = educationReadAloud.play(text, language, setState);
      }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.paper, borderColor: theme.line, borderWidth: 2 }}>
      <Ionicons name={playing ? 'stop-circle-outline' : 'volume-high-outline'} size={24} color={theme.violetDeep} />
    </AnimatedPressable>
    {state === 'error' ? <Text accessibilityRole="alert" style={[s.small, { color: theme.ink, backgroundColor: theme.paper, borderRadius: 12, padding: 10, maxWidth: 220 }]}>{zh ? '暂时无法朗读，请检查设备语音设置后重试。' : 'Reading is unavailable. Check your device’s speech settings and retry.'}</Text> : null}
  </View>;
}
