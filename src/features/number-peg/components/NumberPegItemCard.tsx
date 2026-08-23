import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { Text, View } from 'react-native';

type Props = {
  item: NumberPegItem;
};

export function NumberPegItemCard({ item }: Props) {
  return (
    <View
      style={{
        width: '48%',
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
      }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f766e' }}>{item.number}</Text>
      <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
        {item.keyword}
      </Text>
      <Text style={{ marginTop: 6, fontSize: 12, lineHeight: 17, color: '#64748b' }}>
        {item.description}
      </Text>
    </View>
  );
}
