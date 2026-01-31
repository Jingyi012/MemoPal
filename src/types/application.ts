export interface Step {
  id: number;
  title: string;
  description: string;
  progress?: { current: number; total: number };
  isLocked?: boolean;
}
