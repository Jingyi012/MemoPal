import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Text, View } from 'react-native';

type Props = {
  item: NumberPegItem;
};

export function NumberPegItemCard({ item }: Props) {
  return (
    <View
      style={{
        width: 92,
        height: 116,
        marginRight: 10,
        padding: 10,
        borderRadius: 18,
        backgroundColor: theme.paper,
        borderWidth: 2,
        borderColor: theme.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          position: 'absolute',
          left: 7,
          top: 7,
          minWidth: 22,
          height: 22,
          paddingHorizontal: 5,
          borderRadius: 11,
          backgroundColor: theme.berry,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: 'white' }}>{item.number}</Text>
      </View>
      <Text style={{ fontSize: 34 }}>{item.image}</Text>
      <Text
        numberOfLines={1}
        style={{ marginTop: 7, fontSize: 12, fontWeight: '900', color: theme.ink }}>
        {item.keyword}
      </Text>
    </View>
  );
}
