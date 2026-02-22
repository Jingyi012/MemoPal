import { View } from 'react-native';

interface Props {
  progress: number;
  color: string;
  height: number;
}

export const ProgressBar: React.FC<Props> = ({ progress, color, height }) => (
  <View className="mt-2 w-full overflow-hidden rounded-full bg-gray-200" style={{ height }}>
    <View
      style={{ width: `${progress * 100}%`, backgroundColor: color }}
      className="h-full rounded-full"
    />
  </View>
);
