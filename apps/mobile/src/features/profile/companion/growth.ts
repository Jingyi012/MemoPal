/** Cosmetic stages follow the account's server-owned level; play never awards XP. */
export const COMPANION_STAGES = [
  { level: 1, en: 'A little possibility', zh: '小小的期待', detailEn: 'Tiny fins, bright eyes, and a new friend beside you.', detailZh: '小小的鳍、大大的眼睛，沫沫从今天开始陪着你。' },
  { level: 2, en: 'Hello, Momo', zh: '你好，沫沫', detailEn: 'Momo grows a little bigger and waves hello.', detailZh: '沫沫长大了一点，轻轻拍鳍向你打招呼。' },
  { level: 3, en: 'First swim', zh: '初次游泳', detailEn: 'Little fins. A whole ocean to discover.', detailZh: '小小的鱼鳍，也能探索很大的世界。' },
  { level: 4, en: 'Finding a rhythm', zh: '渐入佳境', detailEn: 'Learning to swim a little further, together.', detailZh: '和你一起，学着游得再远一点。' },
  { level: 5, en: 'Golden ripples', zh: '金色涟漪', detailEn: 'Every little practice leaves a golden ripple.', detailZh: '每一次练习，都漾开一道金色涟漪。' },
  { level: 6, en: 'Brave explorer', zh: '勇敢探索', detailEn: 'Wider fins, bigger adventures.', detailZh: '双鳍舒展开了，冒险也变得更精彩。' },
  { level: 7, en: 'Coral blossom', zh: '珊瑚花开', detailEn: 'A flower for all the days you showed up.', detailZh: '每一天的陪伴，都值得一朵小花。' },
  { level: 8, en: 'Pearl guardian', zh: '珍珠守护', detailEn: 'Keeping your little victories close.', detailZh: '把你的小小进步，珍藏成闪亮的珍珠。' },
  { level: 9, en: 'Starlight swimmer', zh: '逐星而行', detailEn: 'So many memories. A sky full of stars.', detailZh: '一起记住的事情，变成了满天星光。' },
  { level: 10, en: 'Moonlit companion', zh: '月光伙伴', detailEn: 'All grown up. Still right here with you.', detailZh: '已经长大，依然陪在你身边。' },
] as const;

export function getCompanionStage(level: number) {
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return COMPANION_STAGES[Math.min(safeLevel, COMPANION_STAGES.length) - 1];
}

export function companionArtboard(level: number) {
  return `Momo ${String(getCompanionStage(level).level).padStart(2, '0')}`;
}
