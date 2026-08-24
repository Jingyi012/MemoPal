import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { cn } from '@/utils/cn';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Crown } from 'lucide-react-native';
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
        }}
        className="p-4 shadow-lg">
        <View className="flex-row items-center gap-3">
          <Crown size={24} color="white" />

          <View className="flex-1">
            <Text className="font-semibold text-[#2B2A3D]">Upgrade to Premium</Text>
            <Text className="text-sm text-[#6B6A80]">Unlock unlimited palaces & features</Text>
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};
