import type { ComponentProps } from 'react';
import { CommonHeader } from '@/components/CommonHeader';

/** Learning and memory share the app header's layout, accessibility and actions. */
export function LearningHeader(props: ComponentProps<typeof CommonHeader>) {
  return <CommonHeader {...props} />;
}
