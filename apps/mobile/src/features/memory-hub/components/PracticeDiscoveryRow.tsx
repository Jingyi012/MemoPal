import AnimatedPressable from '@/components/AnimatedPressable';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { MapPinned } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export type PracticeDiscoveryItem = {
  key: string;
  title: string;
  subtitle: string;
  tone: 'peg' | 'palace';
  imageUrl?: string | null;
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
            <AnimatedPressable key={item.key} onPress={() => onItemPress(item.key)} style={styles.card}>
              <View style={[styles.art, item.tone === 'peg' ? styles.pegBackground : styles.palaceBackground]}>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" /> : item.tone === 'peg' ? <Text style={styles.emoji}>{item.subtitle}</Text> : <MapPinned size={22} color={theme.violetDeep} />}
              </View>
              <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.imageUrl ? item.subtitle : item.tone === 'peg' ? 'Anchor image' : item.subtitle}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}><Text style={styles.emptyText}>{emptyLabel ?? 'Nothing here yet'}</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 4 },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: theme.inkSoft, fontSize: 13, fontWeight: '900', letterSpacing: 0.4, marginBottom: 0, marginTop: 22, textTransform: 'uppercase' },
  action: { color: theme.sky, fontSize: 11.5, fontWeight: '900', marginTop: 22 },
  list: { gap: 10, paddingRight: 12, paddingVertical: 10 },
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 2, padding: 8, width: 132 },
  art: { alignItems: 'center', borderRadius: 12, height: 76, justifyContent: 'center', overflow: 'hidden' },
  pegBackground: { backgroundColor: '#FFF0F4' },
  palaceBackground: { backgroundColor: '#EEE9FF' },
  image: { backgroundColor: '#BCAAF1', height: '100%', width: '100%' },
  emoji: { fontSize: 31 },
  cardTitle: { color: theme.ink, fontSize: 11.5, fontWeight: '900', marginTop: 7 },
  cardSubtitle: { color: theme.inkSoft, fontSize: 10.5, fontWeight: '700', marginTop: 2 },
  empty: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 2, padding: 14 },
  emptyText: { color: theme.inkSoft, fontSize: 12, fontWeight: '700' },
});
