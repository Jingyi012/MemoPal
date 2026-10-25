export type PetReaction = 'smile' | 'hop' | 'twirl' | 'bubbles' | 'close' | 'rare';
export type IdleBehavior = 'chase' | 'yawn' | 'peek' | 'twirl' | 'blink';

const PET_REACTIONS: readonly PetReaction[] = ['smile', 'hop', 'twirl', 'bubbles', 'close'];
const IDLE_BEHAVIORS: readonly IdleBehavior[] = ['chase', 'yawn', 'peek', 'twirl', 'blink'];

const unit = (random: () => number) => Math.max(0, Math.min(0.999999, random()));

export function choosePetReaction(previous: PetReaction | null, random: () => number = Math.random): PetReaction {
  if (unit(random) < 0.05 && previous !== 'rare') return 'rare';
  const choices = PET_REACTIONS.filter((reaction) => reaction !== previous);
  return choices[Math.floor(unit(random) * choices.length)];
}

export function chooseIdleBehavior(previous: IdleBehavior | null, random: () => number = Math.random, night = false): IdleBehavior {
  if (night && previous !== 'yawn' && unit(random) < .4) return 'yawn';
  const choices = IDLE_BEHAVIORS.filter((behavior) => behavior !== previous);
  return choices[Math.floor(unit(random) * choices.length)];
}

export function nextIdleDelay(random: () => number = Math.random, night = false): number {
  return (6 + unit(random) * 9) * 1000 * (night ? 1.2 : 1);
}

export function timeOfDay(hour: number): 'day' | 'dusk' | 'night' {
  if (hour >= 18 && hour < 21) return 'dusk';
  if (hour >= 21 || hour < 6) return 'night';
  return 'day';
}

export function isTapEasterEgg(taps: readonly number[], now: number): boolean {
  return taps.length >= 5 && taps.slice(-5).every((tap, index, recent) => index === 0 || tap - recent[index - 1] <= 550)
    && now - taps[taps.length - 5] <= 2200;
}
