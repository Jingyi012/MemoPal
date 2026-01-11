import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

export function QuoteCard({ todayQuote }: { todayQuote: string }) {
  return (
    <LinearGradient
      colors={[Colors.purple50, Colors.pink50]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 10,
      }}
      className="mt-6 border-2 border-purple-200 p-4 shadow-sm">
      <Text
        style={{
          color: Colors.gray700,
          fontSize: 14,
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
        "{todayQuote}"
      </Text>
    </LinearGradient>
  );
}
