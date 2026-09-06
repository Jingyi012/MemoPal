import { memopalTheme as theme } from '@/theme/memopalTheme';
import { cn } from '@/utils/cn';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

interface Props {
  className?: string;
}

export const PremiumUpdateCard: React.FC<Props> = ({ className }) => {
  const router = useRouter();
  return (
    <AnimatedPressable onPress={() => router.push('/premium')} className={cn('w-full', className)}>
      <LinearGradient
        colors={[theme.sun, theme.sunDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 10,
          boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.16)',
        }}
        className="p-4">
        <View className="flex-row items-center gap-3">
          <Text className="text-2xl">👑</Text>

          <View className="flex-1">
            <Text className="font-semibold text-[#2B2A3D]">Upgrade to Premium</Text>
            <Text className="text-sm text-[#6B6A80]">Unlock unlimited palaces & features</Text>
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};
