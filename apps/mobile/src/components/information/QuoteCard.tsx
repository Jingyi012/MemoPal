import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

export function QuoteCard({ todayQuote }: { todayQuote: string }) {
  return (
    <LinearGradient
      colors={['#EEE9FF', '#FFF0F4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 10,
      }}
      className="mt-6 border-2 border-[#E0D9FF] p-4 shadow-sm">
      <Text
        style={{
          color: '#6B6A80',
          fontSize: 14,
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
        &quot;{todayQuote}&quot;
      </Text>
    </LinearGradient>
  );
}
