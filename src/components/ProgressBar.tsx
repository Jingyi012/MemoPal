import { View } from 'react-native';

interface Props {
  progress: number;
  color: string;
}

export const ProgressBar: React.FC<Props> = ({ progress, color }) => (
  <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
    <View
      style={{ width: `${progress * 100}%`, backgroundColor: color }}
      className="h-full rounded-full"
    />
  </View>
);
