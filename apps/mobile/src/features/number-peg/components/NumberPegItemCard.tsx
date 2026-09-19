import { useColorScheme } from 'nativewind';
import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { memopalThemes } from '@/theme/memopalTheme';
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
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const { t } = useTranslation('numberPeg');
  const localizedItem = localizeNumberPeg(item, t);
  return (
    <View
      style={{
        width: compact ? 82 : 96,
        height: compact ? 104 : 120,
        marginRight: compact ? 8 : 10,
        padding: compact ? 6 : 10,
        borderRadius: compact ? 14 : 18,
        backgroundColor: locked ? theme.canvas : theme.paper,
        borderWidth: 1.5,
        borderColor: locked ? theme.line : theme.line,
        shadowColor: theme.ink,
        shadowOpacity: locked ? 0 : 0.06,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: locked ? 0 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 3 : 5,
      }}>
      <View
        style={{
          position: 'absolute',
          left: compact ? 6 : 8,
          top: compact ? 6 : 8,
          minWidth: compact ? 19 : 22,
          height: compact ? 19 : 22,
          paddingHorizontal: compact ? 4 : 5,
          borderRadius: compact ? 10 : 11,
          backgroundColor: locked ? theme.canvas : theme.paper,
          borderWidth: 1.5,
          borderColor: locked ? theme.line : theme.berryLine,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontFamily: typography.bodyExtraBold, fontSize: compact ? 9 : 11, color: locked ? theme.inkMuted : theme.berryDeep }}>{item.number}</Text>
      </View>
      <View style={{ width: compact ? 46 : 58, height: compact ? 42 : 53, borderRadius: compact ? 13 : 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, opacity: locked ? 0.55 : 1 }}>
        <Text style={{ fontSize: compact ? 26 : 34 }}>{locked ? '🔒' : item.image}</Text>
      </View>
      <Text
        numberOfLines={1}
        style={{ marginTop: compact ? 4 : 7, fontFamily: typography.bodyExtraBold, fontSize: compact ? 10 : 12, color: locked ? theme.inkSoft : theme.ink }}>
        {locked ? t('locked') : localizedItem.keyword}
      </Text>
    </View>
  );
}
