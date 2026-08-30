import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { Text, View } from 'react-native';

type Props = {
  item: NumberPegItem;
  locked?: boolean;
  compact?: boolean;
};

export function NumberPegItemCard({ item, locked = false, compact = false }: Props) {
  const { t } = useTranslation('numberPeg');
  const localizedItem = localizeNumberPeg(item, t);
  return (
    <View
      style={{
        width: compact ? 78 : 92,
        height: compact ? 94 : 116,
        marginRight: compact ? 0 : 10,
        padding: compact ? 6 : 10,
        borderRadius: compact ? 14 : 18,
        backgroundColor: theme.paper,
        borderWidth: 2,
        borderColor: theme.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          position: 'absolute',
          left: compact ? 5 : 7,
          top: compact ? 5 : 7,
          minWidth: compact ? 19 : 22,
          height: compact ? 19 : 22,
          paddingHorizontal: compact ? 4 : 5,
          borderRadius: compact ? 10 : 11,
          backgroundColor: theme.berry,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontFamily: typography.bodyExtraBold, fontSize: compact ? 9 : 11, color: 'white' }}>{item.number}</Text>
      </View>
      <Text style={{ fontSize: compact ? 26 : 34, opacity: locked ? 0.35 : 1 }}>{locked ? '🔒' : item.image}</Text>
      <Text
        numberOfLines={1}
        style={{ marginTop: compact ? 4 : 7, fontFamily: typography.bodyExtraBold, fontSize: compact ? 10 : 12, color: locked ? theme.inkSoft : theme.ink }}>
        {locked ? t('locked') : localizedItem.keyword}
      </Text>
    </View>
  );
}
