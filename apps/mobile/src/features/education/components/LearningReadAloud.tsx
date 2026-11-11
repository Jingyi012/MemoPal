import { AppText as Text } from '@/components/ui/AppText';
import { appRadii } from '@/theme/designSystem';
import { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LearningIconButton } from './LearningIconButton';
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
    <LearningIconButton icon={playing ? 'stop-circle-outline' : 'volume-high-outline'} label={label} disabled={!focused} busy={state === 'loading'}
      onPress={() => {
        cancel.current?.(); cancel.current = undefined;
        if (playing) { setState('idle'); return; }
        cancel.current = educationReadAloud.play(text, language, setState);
      }} />
    {state === 'error' ? <Text accessibilityRole="alert" style={[s.small, { color: theme.ink, backgroundColor: theme.paper, borderRadius: appRadii.control, padding: 10, maxWidth: 220 }]}>{zh ? '暂时无法朗读，请检查设备语音设置后重试。' : 'Reading is unavailable. Check your device’s speech settings and retry.'}</Text> : null}
  </View>;
}
