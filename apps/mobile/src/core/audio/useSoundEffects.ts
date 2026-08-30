import { useUserState } from '@/contexts/UserStateContext';
import { createAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';
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

  const play = useCallback((effect: SoundEffect) => {
    if (!enabled) return;
    InteractionManager.runAfterInteractions(() => {
      const player = getPlayer(effect);
      if (!player) return;

      try {
        void player.seekTo(0).then(() => player.play()).catch(() => undefined);
      } catch {
        // Audio feedback should never interrupt a practice answer.
      }
    });
  }, [enabled]);

  return { playSound: play, feedbackEnabled: enabled };
}
