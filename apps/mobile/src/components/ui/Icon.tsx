import { LucideIcon } from 'lucide-react-native';

export function TabIcon({
  icon: Icon,
  color,
  size = 22,
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
}) {
  return <Icon size={size} color={color} strokeWidth={2} />;
}
