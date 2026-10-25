import { useEffect, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';
import { GameButton } from '../components/GameButton';
import type { CompanionAction, CompanionCue } from './behavior';
import { GameBurst, GameComboGlow, GameMomo, GameOverlay } from './CompanionPlayUi';
import { useCompanionActive } from './useCompanionActive';
import { INITIAL_PEARL_QUEST, pearlQuestReducer, shuffledPearls } from './pearlQuest';

const TREASURES = ['✦', '❀', '☾', '♥'];
const PEARL_NAME_KEYS = ['pearlName0', 'pearlName1', 'pearlName2', 'pearlName3'] as const;

export function CompanionPearlQuest({ onReact, cue, stage = 1, onSolved, onBack }: {
  onReact: (action: CompanionAction) => void;
  cue?: CompanionCue;
  stage?: number;
  onSolved?: (turns: number) => void;
  onBack: () => void;
}) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('companionGames');
  const active = useCompanionActive();
  const [game, dispatch] = useReducer(pearlQuestReducer, INITIAL_PEARL_QUEST);
  const [area, setArea] = useState({ width: 330, height: 380 });
  const [burst, setBurst] = useState<{ id: number; x: number; y: number; streak: number } | null>(null);

  useEffect(() => {
    if (!active || game.phase !== 'playing') return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [active, game.phase]);
  useEffect(() => {
    if (game.phase === 'timeUp') onReact('encourage');
  }, [game.phase, onReact]);
  useEffect(() => {
    if (game.phase === 'solved') onSolved?.(game.attempts);
  }, [game.phase, game.attempts, onSolved]);
  useEffect(() => {
    if (!active || game.phase !== 'playing' || game.open.length !== 2) return;
    const timer = setTimeout(() => dispatch({ type: 'hide' }), 900);
    return () => clearTimeout(timer);
  }, [active, game.phase, game.open]);
  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst(null), 580);
    return () => clearTimeout(timer);
  }, [burst]);

  const start = () => {
    setBurst(null);
    dispatch({ type: 'start', cards: shuffledPearls() });
    onReact('hello');
  };
  const flip = (index: number) => {
    if (!active || game.phase !== 'playing' || game.open.length === 2) return;
    const next = pearlQuestReducer(game, { type: 'flip', index });
    if (next === game) return;
    dispatch({ type: 'flip', index });
    const cardWidth = Math.min(76, Math.max(48, (area.width - 52) / 4));
    const gridWidth = cardWidth * 4 + 24;
    const column = index % 4;
    const row = Math.floor(index / 4);
    setBurst({ id: index + game.attempts * 8 + game.open.length, streak: next.combo,
      x: (area.width - gridWidth) / 2 + column * (cardWidth + 8) + cardWidth / 2,
      y: area.height * .79 - 2 * cardWidth - 10 + row * (cardWidth + 10) + cardWidth / 2 });
    if (next.phase === 'solved') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onReact('celebrate');
    } else if (next.matched.length > game.matched.length) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReact('correct');
    } else if (next.open.length === 2) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      onReact('encourage');
    } else {
      void Haptics.selectionAsync();
      onReact('think');
    }
  };
  const hint = () => {
    if (!game.hintsLeft || game.open.length > 0) return;
    dispatch({ type: 'hint' });
    onReact('think');
  };
  const cardWidth = Math.min(76, Math.max(48, (area.width - 52) / 4));
  const gridWidth = cardWidth * 4 + 24;
  const treasureCount = game.matched.length / 2;

  return <View style={styles.root}>
    {game.phase !== 'ready' ? <View style={styles.hud}>
      <Text style={styles.hudValue} accessibilityLiveRegion="polite">
        {t('pearlPairs', { count: treasureCount })}
      </Text>
      <Text style={styles.hudValue}>{t('pearlTurns', { count: game.attempts })}</Text>
      <Text style={styles.hudValue} accessibilityLabel={t('pearlTime', { seconds: game.seconds })}>
        {t('pearlTimeShort', { seconds: game.seconds })}
      </Text>
    </View> : <View style={styles.hudSpacer} />}
    <View style={styles.arena} onLayout={event => setArea({
      width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height,
    })}>
      <View pointerEvents="none" style={[styles.orb, styles.orbOne]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbTwo]} />
      <GameComboGlow active={game.combo >= 2 && active} />
      <GameMomo stage={stage} cue={cue ?? { action: 'hello', sequence: 0 }} active={active}
        size={Math.min(150, area.width * .42)} y={game.phase === 'playing' ? -area.height * .32 : -area.height * .23}
        label={t('pearlMomo')} celebrating={game.phase === 'solved'} />
      {game.phase !== 'ready' ? <View style={[styles.progress, { width: Math.min(300, area.width - 40) }]}>
        {[0, 1, 2, 3].map(index => <View key={index}
          style={[styles.progressDot, index < treasureCount && styles.progressDotDone]} />)}
      </View> : null}
      {game.phase === 'playing' ? <View style={[styles.grid, { width: gridWidth }]}>
        {game.cards.map((card, index) => {
          const shown = game.open.includes(index) || game.matched.includes(index);
          const matched = game.matched.includes(index);
          const fill = [theme.sunTint, theme.berryTint, theme.violetTint, theme.mintTint][card];
          const edge = [theme.sun, theme.berry, theme.violet, theme.grass][card];
          return <Pressable key={index}
            accessibilityRole="button"
            accessibilityLabel={shown ? t('pearlTreasure', { name: t(PEARL_NAME_KEYS[card]) })
              : t('pearlShell', { index: index + 1 })}
            accessibilityState={{ disabled: !active || matched || game.open.length === 2, selected: shown }}
            disabled={!active || matched || game.open.length === 2}
            onPress={() => flip(index)}
            style={({ pressed }) => [styles.shell, { width: cardWidth, height: cardWidth,
              backgroundColor: shown ? fill : theme.sky, borderColor: matched ? edge : theme.paper },
              matched && styles.matched, pressed && styles.pressed]}>
            <LinearGradient pointerEvents="none" colors={shown ? [fill, edge] : [theme.sky, theme.violet]}
              style={[styles.shellFace, { width: cardWidth - 8, height: cardWidth - 8 }]}>
              <Text style={[styles.shellSymbol, { color: theme.paper }]}>
                {shown ? TREASURES[card] : '🐚'}
              </Text>
            </LinearGradient>
          </Pressable>;
        })}
      </View> : null}
      {burst ? <GameBurst id={burst.id} x={burst.x} y={burst.y} active={active} streak={burst.streak} /> : null}
      {game.phase === 'ready' ? <GameOverlay title={t('pearlTitle')} detail={t('pearlIntro')}
        primary={t('pearlStart')} onPrimary={start} /> : null}
      {game.phase === 'solved' || game.phase === 'timeUp' ? <GameOverlay
        title={t(game.phase === 'solved' ? 'pearlSolved' : 'pearlTimeUp')}
        detail={t(game.phase === 'solved' ? 'pearlResult' : 'pearlTimeUpResult',
          game.phase === 'solved' ? { turns: game.attempts, combo: game.bestCombo }
            : { count: treasureCount })}
        primary={t('pearlAgain')} onPrimary={start}
        secondary={t('pearlBack')} onSecondary={onBack} /> : null}
      {!active && game.phase === 'playing' ? <GameOverlay title={t('paused')} /> : null}
    </View>
    {game.phase === 'playing' ? <View style={styles.actions}>
      <GameButton label={t('pearlHint', { count: game.hintsLeft })} onPress={hint}
        disabled={!game.hintsLeft || game.open.length > 0} variant="secondary" />
      <GameButton label={t('pearlRestart')} onPress={start} variant="quiet" />
    </View> : <View style={styles.actionsSpacer} />}
  </View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  hud: { height: 52, flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  hudSpacer: { height: 52 },
  hudValue: { minWidth: 100, minHeight: 44, paddingHorizontal: 13, textAlign: 'center', textAlignVertical: 'center',
    overflow: 'hidden', backgroundColor: theme.paper, color: theme.violetDeep, borderRadius: 18,
    fontFamily: typography.displayExtraBold, fontSize: 16 },
  arena: { flex: 1, minHeight: 300, overflow: 'hidden', borderRadius: 30, borderWidth: 2,
    borderColor: theme.skyLine },
  orb: { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    borderColor: theme.paper, backgroundColor: theme.skyTint, opacity: .4 },
  orbOne: { top: '27%', left: '9%' }, orbTwo: { top: '43%', right: '10%', width: 28, height: 28, borderRadius: 14 },
  progress: { position: 'absolute', top: '39%', alignSelf: 'center', flexDirection: 'row', gap: 7 },
  progressDot: { height: 7, flex: 1, borderRadius: 4, backgroundColor: theme.paper, opacity: .62 },
  progressDotDone: { backgroundColor: theme.sun, opacity: 1 },
  grid: { position: 'absolute', bottom: '21%', alignSelf: 'center', flexDirection: 'row',
    flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  shell: { alignItems: 'center', justifyContent: 'center', borderRadius: 23, borderWidth: 2,
    boxShadow: '0px 5px 10px rgba(49,50,85,0.16)' },
  shellFace: { borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  shellSymbol: { fontSize: 27, fontWeight: '800' },
  matched: { borderWidth: 3 },
  pressed: { transform: [{ scale: .93 }] },
  actions: { minHeight: 62, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 8 },
  actionsSpacer: { height: 62 },
}));
