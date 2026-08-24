import { Brain, Calendar, Eye, TrendingUp } from 'lucide-react-native';
import { ColorValue } from 'react-native';

type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

export interface OnboardingSlide {
  icon: any;
  title: string;
  description: string;
  colors: GradientColors;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    icon: Brain,
    title: 'Remember Anything With Memory Palaces',
    description:
      'Use ancient memory techniques to remember lists, speeches, and anything you need.',
    colors: ['#7A68E0', '#E8527A'],
  },
  {
    icon: Eye,
    title: 'Learn With Visualization',
    description: 'Create vivid mental images and stories to make memories stick forever.',
    colors: ['#4FC0E8', '#7A68E0'],
  },
  {
    icon: Calendar,
    title: 'Review With Spaced Repetition',
    description: 'Smart reminders at the perfect time to cement your memory and boost retention.',
    colors: ['#FF6F91', '#E8527A'],
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Palace to 100 Locations',
    description: 'Start with 10 locations and expand your memory palace as you level up.',
    colors: ['#FFC93C', '#F2A900'],
  },
];
