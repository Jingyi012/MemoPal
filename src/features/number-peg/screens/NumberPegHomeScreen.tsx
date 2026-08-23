import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { ScrollView, Text, View } from 'react-native';

export default function NumberPegHomeScreen() {
  const { title, description, items } = useNumberPegOverview();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a' }}>{title}</Text>
      <Text style={{ marginTop: 8, fontSize: 16, lineHeight: 23, color: '#475569' }}>
        {description}
      </Text>

      <View
        style={{
          marginTop: 24,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
        {items.map((item) => (
          <NumberPegItemCard key={item.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}
