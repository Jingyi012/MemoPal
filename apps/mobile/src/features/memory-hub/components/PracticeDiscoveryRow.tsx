import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { typography } from '@/theme/typography';
import { ScrollView, StyleSheet, View } from 'react-native';

export type PracticeDiscoveryItem = {
  key: string;
  title: string;
  subtitle: string;
  tone: 'peg' | 'palace';
  imageUrl?: string | null;
  imageSource?: number;
};

type PracticeDiscoveryRowProps = {
  title: string;
  actionLabel: string;
  onAction: () => void;
  items: PracticeDiscoveryItem[];
  onItemPress: (key: string) => void;
  emptyLabel?: string;
};

export function PracticeDiscoveryRow({
  title,
  actionLabel,
  onAction,
  items,
  onItemPress,
  emptyLabel,
}: PracticeDiscoveryRowProps) {
  const { styles } = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>{title}</Text>
        <AnimatedPressable accessibilityLabel={`${actionLabel} for ${title}`} onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </AnimatedPressable>
      </View>
      {items.length ? (
        <ScrollView horizontal contentContainerStyle={styles.list} showsHorizontalScrollIndicator={false}>
          {items.map((item) => (
            <AnimatedPressable
              key={item.key}
              accessibilityLabel={item.title}
              onPress={() => onItemPress(item.key)}
              style={[styles.card, item.tone === 'peg' ? styles.pegCard : styles.palaceCard]}>
              {item.imageSource || item.imageUrl ? (
                <AppImage imageUrl={item.imageUrl ?? undefined} imageSource={item.imageSource} style={styles.image} />
              ) : <Text style={styles.emoji}>{item.tone === 'peg' ? item.subtitle : '🏰'}</Text>}
              {item.tone === 'palace' ? (
                <View style={styles.palaceNameOverlay}>
                  <Text numberOfLines={1} style={styles.palaceName}>{item.title}</Text>
                </View>
              ) : null}
            </AnimatedPressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}><Text style={styles.emptyText}>{emptyLabel ?? 'Nothing here yet'}</Text></View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { marginTop: 22 },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize, letterSpacing: 0.4, marginBottom: 0, textTransform: 'uppercase' },
  action: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  list: { gap: 9, paddingRight: appSpacing.md, paddingTop: 9, paddingBottom: appSpacing.xs },
  card: { position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: theme.line },
  pegCard: { width: 52, height: 52, borderRadius: appRadii.control, backgroundColor: theme.paper },
  palaceCard: { width: 96, height: 64, borderRadius: appRadii.control, backgroundColor: '#BCAAF1', alignItems: 'stretch', justifyContent: 'flex-end' },
  image: { height: '100%', width: '100%' },
  emoji: { fontSize: appArtworkSizes.small },
  palaceNameOverlay: { position: 'absolute', left: 6, right: 6, bottom: 5 },
  palaceName: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: appTextStyles.caption.fontSize, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  empty: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 2, padding: 14 },
  emptyText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
}));
