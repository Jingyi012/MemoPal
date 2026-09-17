import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, BackHandler, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tours, tourStorageKey, spotlightCardPlacement, type TourScope, type SpotlightRect, type SpotlightTargetId } from '../utils/spotlight';

type Target = { node: View; reveal?: () => void; activate?: () => void | Promise<void> };
type TourContext = {
  start: (scope?: TourScope) => void;
  enter: (scope: TourScope, auto: boolean) => () => void;
  register: (id: SpotlightTargetId, target: Target | null) => void;
};
const Context = createContext<TourContext | null>(null);

export function useSpotlightTour() {
  const context = useContext(Context);
  if (!context) throw new Error('Spotlight tour requires its provider.');
  return context;
}

export function usePageTour(scope: TourScope, auto: boolean, ready = true) {
  const { enter, start } = useSpotlightTour();
  useFocusEffect(useCallback(() => {
    if (ready) return enter(scope, auto);
  }, [enter, scope, auto, ready]));
  return useCallback(() => start(scope), [start, scope]);
}

export function SpotlightTarget({ id, children, onReveal, onActivate }: {
  id: SpotlightTargetId; children: ReactNode; onReveal?: () => void; onActivate?: () => void | Promise<void>;
}) {
  const { register } = useSpotlightTour();
  const actions = useRef({ onReveal, onActivate });
  actions.current = { onReveal, onActivate };
  const hasAction = Boolean(onActivate);
  const ref = useCallback((node: View | null) => register(id, node ? {
    node, reveal: () => actions.current.onReveal?.(),
    activate: hasAction ? () => actions.current.onActivate?.() : undefined,
  } : null), [id, register, hasAction]); // Keep measurements stable while callbacks update.
  return <View ref={ref} collapsable={false}>{children}</View>;
}

export function SpotlightTourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useTranslation('onboarding');
  const { styles } = useStyles();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const root = useRef<View>(null);
  const targets = useRef<Partial<Record<SpotlightTargetId, Target>>>({});
  const [scope, setScope] = useState<TourScope>('overview');
  const pageVersion = useRef(0);
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [storageError, setStorageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const userId = user?.id;
  const active = index !== null;
  const steps = tours[scope];
  const storageKey = userId ? tourStorageKey(userId, scope) : null;
  const register = useCallback((id: SpotlightTargetId, target: Target | null) => {
    if (target) targets.current[id] = target;
    else delete targets.current[id];
  }, []);
  const start = useCallback((nextScope: TourScope = 'overview') => {
    setScope(nextScope); setRect(null); setStorageError(false); setIndex(0);
  }, []);
  const enter = useCallback((nextScope: TourScope, auto: boolean) => {
    const version = ++pageVersion.current;
    setIndex(null); setRect(null);
    if (auto && userId) {
      void AsyncStorage.getItem(tourStorageKey(userId, nextScope)).then((value) => {
        if (version === pageVersion.current && value !== 'dismissed') start(nextScope);
      }).catch(() => { /* Manual replay remains available if local preferences cannot be read. */ });
    }
    return () => {
      if (version === pageVersion.current) { pageVersion.current++; setIndex(null); setRect(null); }
    };
  }, [userId, start]);
  const contextValue = useMemo(() => ({ start, register, enter }), [start, register, enter]);

  useEffect(() => { setIndex(null); setRect(null); }, [userId]);

  // Measure the actual native icons relative to the overlay, including safe areas.
  useEffect(() => {
    if (index === null) return;
    let cancelled = false;
    setRect(null);
    targets.current[steps[index]]?.reveal?.();
    const measure = () => {
      const target = targets.current[steps[index]];
      root.current?.measureInWindow((rootX, rootY) => {
        target?.node.measureInWindow((x, y, width, height) => {
          if (!cancelled && width > 0 && height > 0) {
            const next = { x: x - rootX, y: y - rootY, width, height };
            setRect((current) => current && current.x === next.x && current.y === next.y
              && current.width === width && current.height === height ? current : next);
          }
        });
      });
    };
    measure();
    const timer = setInterval(measure, 200);
    return () => { cancelled = true; clearInterval(timer); };
  }, [index, steps, window.width, window.height, layout.width, layout.height]);

  const close = useCallback(async () => {
    if (saving) return false;
    setSaving(true);
    setStorageError(false);
    try {
      if (storageKey) await AsyncStorage.setItem(storageKey, 'dismissed');
      setIndex(null);
      setRect(null);
      return true;
    } catch {
      setStorageError(true);
      return false;
    } finally { setSaving(false); }
  }, [storageKey, saving]);

  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { void close(); return true; });
    return () => subscription.remove();
  }, [active, close]);

  const step = index === null ? null : steps[index];
  const title = step ? t(`spotlight${step}Title`) : '';
  useEffect(() => {
    if (title) AccessibilityInfo.announceForAccessibility(title);
  }, [title]);
  const placement = spotlightCardPlacement(rect, layout.height, insets.top);
  const below = Boolean(rect && rect.y + rect.height / 2 < layout.height / 2);
  const targetAction = step ? targets.current[step]?.activate : undefined;
  const activationLock = useRef(false);
  const activate = async () => {
    if (activationLock.current || index === null) return;
    activationLock.current = true;
    try {
      if (index === steps.length - 1 || targetAction) {
        if (!await close()) return;
      } else { setRect(null); setIndex(index + 1); }
      await targetAction?.();
    } finally { activationLock.current = false; }
  };

  return (
    <Context.Provider value={contextValue}>
      <View ref={root} style={styles.root} onLayout={(event) => setLayout(event.nativeEvent.layout)}>
        <View style={styles.root} accessibilityElementsHidden={active && Boolean(rect)} importantForAccessibility={active && rect ? 'no-hide-descendants' : 'auto'}>
          {children}
        </View>
        {active && step && rect ? (
          <View style={StyleSheet.absoluteFill} accessibilityViewIsModal onAccessibilityEscape={() => void close()}>
            <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => {}} />
            <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
              <Defs><Mask id="spotlight"><Rect width="100%" height="100%" fill="white" />
                {rect ? <Rect x={rect.x - 6} y={rect.y - 6} width={rect.width + 12} height={rect.height + 12} rx={Math.min(24, (rect.height + 12) / 2)} fill="black" /> : null}
              </Mask></Defs>
              <Rect width="100%" height="100%" fill="rgba(8,7,20,0.82)" mask="url(#spotlight)" />
              {rect ? <Rect x={rect.x - 8} y={rect.y - 8} width={rect.width + 16} height={rect.height + 16} rx={Math.min(26, (rect.height + 16) / 2)} stroke="#FFC93C" strokeWidth={2} fill="none" /> : null}
            </Svg>
            <Pressable accessibilityRole="button" accessibilityLabel={targetAction ? title : t('spotlightContinueHint')} disabled={saving}
              onPress={() => void activate()} style={{ position: 'absolute', left: rect.x - 4, top: rect.y - 4, width: rect.width + 8, height: Math.max(44, rect.height + 8) }} />
            <AnimatedPressable accessibilityLabel={t('skip')} disabled={saving} onPress={() => void close()}
              style={[styles.dismiss, { top: insets.top + 4 }]}><Text style={styles.dismissText}>×</Text></AnimatedPressable>
            <View style={[styles.card, placement, { justifyContent: below ? 'flex-start' : 'flex-end' }]}>
              <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.copy}>
                <Text style={styles.counter}>{t('spotlightProgress').replace('{step}', String(index! + 1)).replace('{total}', String(steps.length))}</Text>
                <Text style={styles.emoji} accessible={false}>{'✨'}</Text>
                <Text accessibilityRole="header" style={styles.title}>{title}</Text>
                <Text style={styles.body}>{t(`spotlight${step}Body`)}</Text>
                <Text style={styles.hint}>{t(targetAction ? 'spotlightActionHint' : 'spotlightContinueHint')}</Text>
                {storageError ? <Text accessibilityRole="alert" style={styles.body}>{t('spotlightSaveError')}</Text> : null}
              </ScrollView>
            </View>

          </View>
        ) : null}
      </View>
    </Context.Provider>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  root: { flex: 1 },
  card: { position: 'absolute', left: 20, right: 20, justifyContent: 'flex-end' },
  copy: { backgroundColor: theme.paper, padding: 20, borderRadius: 24, gap: 14 },
  counter: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 13 },
  emoji: { fontSize: 32 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 24 },
  body: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 16, lineHeight: 25 },
  hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18 },
  dismiss: { position: 'absolute', right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#262336', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  dismissText: { color: 'white', fontSize: 28 },
}));
