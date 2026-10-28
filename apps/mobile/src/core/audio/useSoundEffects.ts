import { useUserState } from '@/contexts/UserStateContext';
import { createAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

const correctSource = require('../../../assets/sounds/correct.wav');
const wrongSource = require('../../../assets/sounds/wrong.wav');
const completeSource = require('../../../assets/sounds/complete.wav');

export type SoundEffect = 'correct' | 'wrong' | 'complete';

const players: Partial<Record<SoundEffect, ReturnType<typeof createAudioPlayer>>> = {};

function getPlayer(effect: SoundEffect) {
  if (!players[effect]) {
    players[effect] = createAudioPlayer(
      effect === 'correct' ? correctSource : effect === 'wrong' ? wrongSource : completeSource,
    );
  }
  return players[effect];
}

/** Short, optional feedback sounds shared by memory practice screens. */
export function useSoundEffects() {
  const { userState } = useUserState();
  const enabled = userState.preferences.soundEnabled;
  const enabledRef = useRef(enabled);
  const mountedRef = useRef(true);
  const pendingTasks = useRef(new Set<ReturnType<typeof InteractionManager.runAfterInteractions>>());
  enabledRef.current = enabled;

  useEffect(() => {
    mountedRef.current = true;
    const tasks = pendingTasks.current;
    return () => {
      mountedRef.current = false;
      tasks.forEach(task => task.cancel());
      tasks.clear();
    };
  }, []);

  const play = useCallback((effect: SoundEffect) => {
    if (!enabledRef.current || !mountedRef.current) return;
    try {
      const task = InteractionManager.runAfterInteractions(() => {
        pendingTasks.current.delete(task);
        if (!mountedRef.current || !enabledRef.current) return;
        try {
          const player = getPlayer(effect);
          void player.seekTo(0).then(() => {
            if (mountedRef.current && enabledRef.current) player.play();
          }).catch(() => undefined);
        } catch {
          // Audio feedback should never interrupt a practice answer.
        }
      });
      pendingTasks.current.add(task);
    } catch {
      // Audio feedback should never interrupt a practice answer.
    }
  }, []);

  return { playSound: play, feedbackEnabled: enabled };
}
