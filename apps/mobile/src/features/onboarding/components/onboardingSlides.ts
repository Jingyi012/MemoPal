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
    colors: ['#14b8a6', '#0d9488'],
  },
  {
    icon: Eye,
    title: 'Learn With Visualization',
    description: 'Create vivid mental images and stories to make memories stick forever.',
    colors: ['#6366f1', '#4f46e5'],
  },
  {
    icon: Calendar,
    title: 'Review With Spaced Repetition',
    description: 'Smart reminders at the perfect time to cement your memory and boost retention.',
    colors: ['#a855f7', '#7e22ce'],
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Palace to 100 Locations',
    description: 'Start with 10 locations and expand your memory palace as you level up.',
    colors: ['#f97316', '#ea580c'],
  },
];
