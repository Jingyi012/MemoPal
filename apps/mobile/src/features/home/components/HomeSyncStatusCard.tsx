import AnimatedPressable from '@/components/AnimatedPressable';
import { RefreshCcw } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function HomeSyncStatusCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}><RefreshCcw size={17} color="#8D4A1F" /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>Some updates are delayed</Text>
        <Text style={styles.body}>Your saved memories are still here. Try again when you’re online.</Text>
      </View>
      <AnimatedPressable accessibilityLabel="Retry Home sync" onPress={onRetry} style={styles.retry}>
        <RefreshCcw size={15} color="#2B2A3D" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 17, borderWidth: 1.5, borderColor: '#F2C79F', backgroundColor: '#FFF1E4', padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  icon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#FFE4C8', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { color: '#2C241F', fontSize: 12, fontWeight: '900' },
  body: { color: '#665A51', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  retry: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#FFC93C', alignItems: 'center', justifyContent: 'center' },
});
