export type CompanionAction =
  'idle' | 'hello' | 'pet' | 'highFive' | 'dance' | 'correct' | 'encourage' | 'celebrate' | 'think'
  | 'hug' | 'chase' | 'yawn' | 'peek' | 'spin' | 'rare';
export type CompanionCue = { action: CompanionAction; sequence: number };

export const ACTION_DURATION: Record<CompanionAction, number> = {
  idle: 0,
  hello: 1800,
  pet: 2200,
  highFive: 1600,
  dance: 3200,
  correct: 1400,
  encourage: 2000,
  celebrate: 2800,
  think: 1800,
  hug: 1900,
  chase: 1750,
  yawn: 2300,
  peek: 1900,
  spin: 2300,
  rare: 2600,
};

/** Learning reactions take precedence over decorative gestures. */
export function actionForTrigger(trigger: string): CompanionAction {
  switch (trigger) {
    case 'practice':
    case 'bond':
      return 'celebrate';
    case 'greeting':
    case 'return':
      return 'hello';
    case 'outfit':
      return 'dance';
    case 'star':
      return 'highFive';
    default:
      return 'pet';
  }
}

