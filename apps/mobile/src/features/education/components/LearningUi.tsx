import { createLearningStyles as createThemedStyles, learningPalettes, type LearningPalette, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

export type LearningSubject = 'science' | 'math' | 'english' | 'other';
export type LearningTheme = { key: LearningSubject; color: string; dark: string; tint: string; line: string; gradient: readonly [string, string]; icon: 'flask' | 'calculator' | 'chatbubbles' | 'book' };
export function learningThemeFor(title: string, palette: LearningPalette = learningPalettes.light): LearningTheme {
  const key: LearningSubject = /science|科学|sains/i.test(title) ? 'science' : /math|数学|matematik/i.test(title) ? 'math' : /english|英语|英文/i.test(title) ? 'english' : 'other';
  const roles = {
    science: { color: palette.successText, dark: palette.isDark ? palette.ink : '#073B25', gradient: palette.science as [string, string], tint: palette.mintTint, line: palette.mintLine, icon: 'flask' as const },
    math: { color: palette.isDark ? palette.sun : '#B85A12', dark: palette.isDark ? palette.ink : '#5A3300', gradient: palette.math as [string, string], tint: palette.sunTint, line: palette.sunLine, icon: 'calculator' as const },
    english: { color: palette.isDark ? palette.sky : '#405EAE', dark: palette.isDark ? palette.ink : '#203567', gradient: palette.english as [string, string], tint: palette.skyTint, line: palette.skyLine, icon: 'chatbubbles' as const },
    other: { color: palette.violetDeep, dark: palette.ink, gradient: [palette.violetTint, palette.violetLine] as [string, string], tint: palette.violetTint, line: palette.violetLine, icon: 'book' as const },
  };
  return { key, ...roles[key] };
}
export const LearningThemeContext = createContext<LearningTheme>(learningThemeFor(''));
export function useLearningTheme() {
  const inherited = useContext(LearningThemeContext);
  const { theme } = useLearningStyles();
  const titles = { science: 'science', math: 'math', english: 'english', other: '' };
  return learningThemeFor(titles[inherited.key], theme);
}
export function useLearningCopy() {
  const { language } = useTranslation('home');
  const zh = language === 'zh';
  return { zh, all: zh ? '全部' : 'All', science: zh ? '科学' : 'Science', math: zh ? '数学' : 'Math', english: zh ? '英语' : 'English',
    hello: (name: string) => zh ? `你好，${name}！` : `Hi, ${name}!`, ready: zh ? '和沫沫一起，向前一步' : 'One little step with Momo',
    continue: zh ? '继续学习' : 'Continue learning', path: zh ? '学习路径' : 'Learning path', content: zh ? '学习内容' : 'Study', practice: zh ? '练习' : 'Practice', memory: zh ? '记忆练习' : 'Memory practice',
    recommended: zh ? '推荐' : 'Recommended', current: zh ? '从这里开始' : 'Start here', done: zh ? '已完成' : 'Complete', notStarted: zh ? '未开始' : 'Not started', underway: zh ? '进行中' : 'In progress',
    correct: (n: number, total: number) => zh ? `已答对 ${n}/${total}` : `${n}/${total} solved`, time: (n: number) => zh ? `${n} 题 · 约 ${Math.max(1, Math.ceil(n * .75))} 分钟` : `${n} questions · about ${Math.max(1, Math.ceil(n * .75))} min`,
    tools: zh ? '让记忆变得有趣' : 'Make it memorable', toolsBody: zh ? '用记忆宫殿和数字桩，记住学习要点' : 'Explore Memory Palace and Number Peg tools',
    challenge: zh ? '测评挑战' : 'Practice challenge', challengeBody: zh ? '检验今天学到的内容' : 'Check what you have learned',
    filter: zh ? '筛选课程' : 'Filter courses', filterSubject: zh ? '学科' : 'Subject', filterStatus: zh ? '学习状态' : 'Learning status',
    inProgress: zh ? '进行中' : 'In progress', new: zh ? '未开始' : 'Not started', completed: zh ? '已完成' : 'Completed',
    clearFilters: zh ? '清除筛选' : 'Clear filters', reset: zh ? '重置' : 'Reset',
    showCourses: (count: number) => zh ? `显示 ${count} 门课程` : `Show ${count} courses`, removeFilter: zh ? '移除此筛选' : 'Remove this filter',
    note: zh ? '关于公开练习' : 'About public practice', lessons: zh ? '测评练习' : 'Practice lessons', reinforce: zh ? '待巩固' : 'Keep practising',
    more: zh ? '更多课程操作' : 'More course actions', close: zh ? '关闭' : 'Close', next: zh ? '下一步' : 'Next',
    celebrate: zh ? '又前进了一步！' : 'Another step forward!', reviewMemory: zh ? '用记忆练习巩固知识点' : 'Strengthen these ideas with memory practice',
    memoryTitle: zh ? '把知识点放进记忆里' : 'Put these ideas into memory', memoryBody: zh ? '选择课程推荐的记忆法，看看它如何帮助你记住要点。' : 'Explore the memory methods recommended for this course.',
    palace: zh ? '🏛️ 宫殿' : '🏛️ Palace', numberPeg: zh ? '🔢 数字桩' : '🔢 Number Peg',
    startMemory: zh ? '打开记忆练习' : 'Open memory practice', memoryItems: zh ? '学习条目' : 'Memory items',
    memoryNotReady: zh ? '这门课程还没有推荐的记忆练习。' : 'There is no recommended memory practice for this course yet.',
    stars: zh ? '本轮练习之星' : 'Your practice stars', firstTry: zh ? '首次答对' : 'First try correct',
    feedbackCorrect: zh ? '答对了！' : 'You got it!', feedbackWrong: zh ? '差一点，再记一下' : 'Almost! Let’s review.',
    correctAnswer: zh ? '正确答案' : 'Correct answer',
    tip: zh ? '这是一段轻松练习，不计课堂成绩。答完可以看反馈，再试一次。' : 'This is relaxed practice, not a classroom grade. Check feedback and try again.',
    gotIt: zh ? '知道啦，开始吧' : 'Got it, let’s go', noMemory: zh ? '本知识点暂未推荐记忆练习' : 'No memory practice recommended yet',
    empty: zh ? '还没有找到课程，换个关键词试试吧' : 'No courses found. Try another search.',
  };
}

export function LearningArrival({ children, style }: { children: ReactNode; style?: import('react-native').StyleProp<import('react-native').ViewStyle> }) {
  const reduce = useReducedMotion();
  return <Animated.View entering={reduce ? undefined : FadeInUp.duration(260)} style={style}>{children}</Animated.View>;
}
export function LearningButton({ label, onPress, disabled, secondary = false, loading = false, tone = 'primary', compact = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; theme?: LearningTheme; loading?: boolean; tone?: 'primary' | 'success' | 'white'; compact?: boolean;
}) {
  const { theme: palette, styles } = useLearningStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
    style={[styles.button, { minHeight: compact ? 48 : 54, paddingHorizontal: compact ? 11 : 20, backgroundColor: disabled ? palette.disabled : secondary || tone === 'white' ? palette.paper : tone === 'success' ? palette.successText : palette.violetDeep, borderColor: disabled ? palette.disabledShadow : secondary ? palette.line : tone === 'white' ? 'rgba(0,0,0,.18)' : tone === 'success' ? palette.successShadow : palette.primaryShadow }, secondary && { borderWidth: 2, borderBottomWidth: 6 }]}>
    <Text style={[styles.buttonText, { fontSize: compact || secondary || tone === 'white' ? 14 : 16, color: disabled ? palette.inkSoft : secondary || tone === 'white' ? palette.violetDeep : palette.onAccent }]}>{loading ? '…' : label}</Text>
  </AnimatedPressable>;
}
export function SubjectArtwork({ theme, size = 72 }: { theme: LearningTheme; size?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: size * .76 }}>{theme.key === 'science' ? '🌱' : theme.key === 'math' ? '🍕' : theme.key === 'english' ? '💬' : '📚'}</Text></View>;
}
export function LearningProgress({ value, total, color, height = 10 }: { value: number; total: number; color?: string; height?: number }) {
  const theme = useLearningTheme();
  const { styles } = useLearningStyles();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => { const ratio = total ? Math.min(1, value / total) : 0; progress.value = reduced ? ratio : withTiming(ratio, { duration: 400 }); }, [progress, reduced, total, value]);
  const animatedStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as `${number}%` }));
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total || 1, now: value }} style={[styles.track, { height }]}>
    <Animated.View style={[styles.fill, { backgroundColor: color ?? theme.color }, animatedStyle]} />
  </View>;
}
export function LearningRing({ value, total, theme }: { value: number; total: number; theme: LearningTheme }) {
  const ratio = total ? Math.min(1, value / total) : 0;
  return <View accessibilityLabel={`${value}/${total}`} style={{ height: 84, width: 84, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={84} height={84} style={StyleSheet.absoluteFill}><Circle cx={42} cy={42} r={34} stroke={theme.line} strokeWidth={10} fill="none" /><Circle cx={42} cy={42} r={34} stroke={theme.color} strokeWidth={10} fill="none" strokeDasharray={`${ratio * 213.6} 213.6`} strokeLinecap="round" rotation={-90} origin="42,42" /></Svg>
    <Text style={{ color: theme.dark, fontFamily: typography.bodyExtraBold, fontSize: 17 }}>{Math.round(ratio * 100)}%</Text>
  </View>;
}
export function LearningConfetti({ visible, sequence }: { visible: boolean; sequence: number }) {
  const { theme } = useLearningStyles();
  const reduceMotion = useReducedMotion();
  if (!visible || reduceMotion) return null;
  const colors = [theme.sun, theme.grass, theme.violetDeep, theme.sky, theme.berry, '#FF9A62'];
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 5, overflow: 'hidden' }}>
    {Array.from({ length: 28 }, (_, index) => <ConfettiParticle key={`${sequence}-${index}`} index={index} sequence={sequence} color={colors[index % colors.length]!} />)}
  </Animated.View>;
}
function ConfettiParticle({ index, sequence, color }: { index: number; sequence: number; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withDelay(index * 9, withTiming(1, { duration: 1300 })); }, [index, progress, sequence]);
  const angle = Math.PI * (1.08 + (index / 27) * .84);
  const distance = 108 + (index % 6) * 23;
  const translateX = Math.cos(angle) * distance;
  const translateY = Math.sin(angle) * distance + 112;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, .08, .72, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: translateX * progress.value },
      { translateY: translateY * progress.value },
      { rotate: `${progress.value * (index % 2 ? 540 : -540)}deg` },
      { scale: 1 - progress.value * .35 },
    ],
  }), [index, translateX, translateY]);
  return <Animated.View style={[{ position: 'absolute', top: 150, left: '50%', width: index % 4 === 0 ? 9 : 11, height: index % 3 === 0 ? 17 : 12, borderRadius: 2, backgroundColor: color }, style]} />;
}
export function LearningSkeleton() {
  const { theme } = useLearningStyles();
  return <View accessibilityLabel="Loading" accessibilityState={{ busy: true }} style={{ gap: 16 }}>
    {[150, 110, 110].map((height, index) => <View key={index} style={{ height, borderRadius: 24, backgroundColor: theme.violetTint, padding: 20, gap: 14 }}><View style={{ width: '65%', height: 18, backgroundColor: theme.line, borderRadius: 9 }} /><View style={{ width: '90%', height: 12, backgroundColor: theme.line, borderRadius: 6 }} /></View>)}
  </View>;
}
export function LearningLoadingView({ description }: { description?: string }) {
  const { styles } = useLearningStyles();
  return <View style={[styles.content, { flex: 1 }]}><LearningSkeleton />{description ? <Text style={styles.body}>{description}</Text> : null}</View>;
}
export const useLearningStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas }, content: { padding: 16, gap: 14, paddingBottom: 24 },
  card: { backgroundColor: theme.paper, borderRadius: 22, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.line, padding: 14, gap: 10 },
  courseHero: { borderRadius: 26, padding: 16, gap: 14, overflow: 'hidden' },
  memoryCard: { borderRadius: 26, padding: 16, gap: 12, overflow: 'hidden' },
  resultHero: { alignItems: 'center', borderRadius: 30, gap: 8, minHeight: 245, justifyContent: 'center', overflow: 'hidden', padding: 22 },
  resultTitle: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 26, lineHeight: 34, textAlign: 'center' },
  resultSubtitle: { color: '#FFFFFF', maxWidth: 260, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  resultStats: { flexDirection: 'row', gap: 8 },
  resultStat: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 2, flex: 1, justifyContent: 'center', minHeight: 78, paddingHorizontal: 4, paddingVertical: 8 },
  resultNumber: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  resultLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, textAlign: 'center' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 22, lineHeight: 28 },
  heading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16, lineHeight: 22 },
  body: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 20 },
  small: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { minHeight: 54, borderRadius: 18, borderBottomWidth: 5, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: typography.displayExtraBold, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  track: { height: 10, borderRadius: 10, backgroundColor: theme.violetTint, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: theme.violetTint },
  dock: { backgroundColor: theme.canvas, padding: 16, gap: 10, flexShrink: 0 },
}));
