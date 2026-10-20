import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ComponentType } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

export type AppIconProps = {
  color?: string;
  fill?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * Compatibility type for existing icon props. The renderer is intentionally
 * centralized so the mobile app has one visual icon language.
 */
export type LucideIcon = ComponentType<AppIconProps>;

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function createIcon(name: IoniconName): LucideIcon {
  const AppIcon: LucideIcon = ({ color = '#2B2A3D', fill, size = 24, style, testID }) => (
    <Ionicons
      color={fill && fill !== 'none' && fill !== 'currentColor' ? fill : color}
      name={name}
      size={size}
      style={style}
      testID={testID}
    />
  );

  AppIcon.displayName = `AppIcon(${name})`;
  return AppIcon;
}

export const AlertCircle = createIcon('alert-circle');
export const Archive = createIcon('archive');
export const ArchiveRestore = createIcon('archive');
export const ArrowLeft = createIcon('arrow-back');
export const ArrowLeftRight = createIcon('swap-horizontal');
export const ArrowRight = createIcon('arrow-forward');
export const BookOpen = createIcon('book');
export const BookOpenCheck = createIcon('book');
export const Bookmark = createIcon('bookmark');
export const Bell = createIcon('notifications');
export const Building2 = createIcon('business');
export const CalendarClock = createIcon('calendar');
export const Camera = createIcon('camera');
export const Check = createIcon('checkmark');
export const CheckCheck = createIcon('checkmark-done');
export const CheckCircle2 = createIcon('checkmark-circle');
export const ChevronDown = createIcon('chevron-down');
export const ChevronLeft = createIcon('chevron-back');
export const ChevronRight = createIcon('chevron-forward');
export const ChevronUp = createIcon('chevron-up');
export const Circle = createIcon('ellipse-outline');
export const CircleHelp = createIcon('help-circle');
export const ClipboardList = createIcon('clipboard');
export const Clock3 = createIcon('time');
export const Coins = createIcon('cash');
export const Copy = createIcon('copy');
export const Crown = createIcon('ribbon');
export const Eye = createIcon('eye');
export const Flag = createIcon('flag');
export const Flame = createIcon('flame');
export const Globe2 = createIcon('globe');
export const GripVertical = createIcon('menu');
export const Hash = createIcon('keypad');
export const Heart = createIcon('heart');
export const History = createIcon('time');
export const Home = createIcon('home');
export const Image = createIcon('image');
export const ImagePlus = createIcon('image');
export const Images = createIcon('images');
export const Inbox = createIcon('file-tray');
export const Info = createIcon('information-circle');
export const LayoutGrid = createIcon('grid');
export const Layers = createIcon('layers');
export const Lightbulb = createIcon('bulb');
export const Link2 = createIcon('link');
export const List = createIcon('list');
export const LogOut = createIcon('log-out');
export const LockKeyhole = createIcon('lock-closed');
export const Mail = createIcon('mail');
export const MoreHorizontal = createIcon('ellipsis-horizontal');
export const MapPin = createIcon('location');
export const Maximize2 = createIcon('expand');
export const MessageCircle = createIcon('chatbubble');
export const Pencil = createIcon('pencil');
export const Plus = createIcon('add');
export const RefreshCcw = createIcon('refresh');
export const RefreshCw = createIcon('refresh');
export const RotateCcw = createIcon('reload');
export const ScanText = createIcon('scan');
export const Search = createIcon('search');
export const Settings = createIcon('settings');
export const Shirt = createIcon('shirt-outline');
export const Share2 = createIcon('share-social');
export const SlidersHorizontal = createIcon('options');
export const Sparkles = createIcon('sparkles');
export const Star = createIcon('star');
export const Trash2 = createIcon('trash');
export const TrendingUp = createIcon('trending-up');
export const Trophy = createIcon('trophy');
export const Users = createIcon('people');
export const WalletCards = createIcon('wallet');
export const Wifi = createIcon('wifi');
export const WifiOff = createIcon('wifi-outline');
export const X = createIcon('close');
export const Zap = createIcon('flash');

