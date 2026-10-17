export type CompanionReactionKind = 'tap' | 'greet' | 'returnPractice';

type ReactionLine = { en: string; zh: string };
type CharacterVoice = Record<CompanionReactionKind, readonly ReactionLine[]>;

const VOICES: Record<string, CharacterVoice> = {
  'memory-owl': {
    tap: [{ en: 'A thoughtful little nod for you.', zh: '给你一个认真又轻柔的点头。' }, { en: 'I was just saving you a bright idea.', zh: '我刚好为你留了一点灵感。' }],
    greet: [{ en: 'Your hello makes this a lovely moment.', zh: '你的招呼让这一刻变得很美好。' }, { en: 'I kept a little starlight for your visit.', zh: '我为你的到来留了一点星光。' }],
    returnPractice: [{ en: 'That was a good little stretch of learning.', zh: '刚才那段学习时光真不错。' }, { en: 'I liked sharing that quiet focus with you.', zh: '我喜欢和你一起专心的感觉。' }],
  },
  'memory-fox': {
    tap: [{ en: 'Aha, you found me!', zh: '哈，被你发现啦！' }, { en: 'Ready when you are, clever one.', zh: '聪明的你准备好时，我就出发。' }],
    greet: [{ en: 'There you are—my favorite plot twist.', zh: '你来啦，真是最棒的意外转折。' }, { en: 'Hello back! I saved you the bright spot.', zh: '你好呀！我把最亮的那一刻留给你。' }],
    returnPractice: [{ en: 'We caught a clever little win together.', zh: '我们一起抓住了一个聪明的小进步。' }, { en: 'That practice had a nice spark to it.', zh: '刚才的练习闪着一点小火花。' }],
  },
  'memory-otter': {
    tap: [{ en: 'A tiny splash of hello!', zh: '送你一个小小的水花问候！' }, { en: 'Found you! This is fun already.', zh: '找到你啦！已经开始好玩了。' }],
    greet: [{ en: 'Hello! I saved you a sunny pebble.', zh: '你好呀！我给你留了一颗暖暖的小石子。' }, { en: 'You’re here! Let’s float along together.', zh: '你来啦！我们一起轻轻向前漂吧。' }],
    returnPractice: [{ en: 'We made a little wave of progress.', zh: '我们一起推起了一朵进步的小浪花。' }, { en: 'That was a lovely thing to do side by side.', zh: '并肩完成这件事，感觉真好。' }],
  },
  'memory-bear': {
    tap: [{ en: 'A warm, steady hello.', zh: '给你一个温暖、踏实的问候。' }, { en: 'I’m right here beside you.', zh: '我就在你身边。' }],
    greet: [{ en: 'It’s good to have you back.', zh: '你回来真好。' }, { en: 'There’s always room for you here.', zh: '这里总有你的位置。' }],
    returnPractice: [{ en: 'We took that step at our own pace.', zh: '我们按自己的节奏走完了这一步。' }, { en: 'I’m glad we made time for that together.', zh: '很高兴我们一起留出了这段时间。' }],
  },
  'memory-hummingbird': {
    tap: [{ en: 'A little flutter just for you!', zh: '为你轻轻扑闪一下！' }, { en: 'Oh, there you are!', zh: '呀，你在这里！' }],
    greet: [{ en: 'Your hello brightened my whole day.', zh: '你的招呼点亮了我的今天。' }, { en: 'Back together—what a lovely little moment!', zh: '又在一起啦，多美好的小瞬间！' }],
    returnPractice: [{ en: 'We made a bright little bit of progress.', zh: '我们一起收获了一点闪亮的进步。' }, { en: 'That was a lovely moment to share.', zh: '刚才那段时光，值得一起珍藏。' }],
  },
};

const STAGE_NOTES: Record<string, ReactionLine> = {
  new: { en: 'We’re just getting to know each other.', zh: '我们才刚刚开始认识彼此。' },
  familiar: { en: 'I’m starting to know your rhythm.', zh: '我渐渐熟悉你的节奏了。' },
  in_sync: { en: 'We make a good little team.', zh: '我们越来越有默契啦。' },
  best_friends: { en: 'I know this rhythm by heart.', zh: '你的节奏，我已经记在心里。' },
};

const GENERIC_VOICE: CharacterVoice = {
  tap: [{ en: 'A little hello, just for you.', zh: '送你一个小小的问候。' }, { en: 'I’m glad you stopped by.', zh: '很高兴你来看看我。' }],
  greet: [{ en: 'It’s lovely to see you.', zh: '见到你真好。' }, { en: 'I saved you a little hello.', zh: '我给你留了一句问候。' }],
  returnPractice: [{ en: 'I’m glad we shared that moment.', zh: '很高兴我们一起度过了那段时光。' }, { en: 'That was a good step to take together.', zh: '一起迈出这一步，真不错。' }],
};

/** Returns authored copy only; it never changes server-owned bond state. */
export function getCompanionReaction(
  assetKey: string | undefined,
  bondStage: string,
  kind: CompanionReactionKind,
  index: number,
  chinese: boolean,
) {
  const voice = VOICES[assetKey ?? ''] ?? GENERIC_VOICE;
  const line = voice[kind][Math.abs(index) % voice[kind].length];
  const stage = STAGE_NOTES[bondStage.toLowerCase()];
  const localizedLine = chinese ? line.zh : line.en;
  // Keep everyday reactions short; weave the relationship note in occasionally.
  if (!stage || index % 3 !== 2) return localizedLine;
  return `${localizedLine} ${chinese ? stage.zh : stage.en}`;
}
