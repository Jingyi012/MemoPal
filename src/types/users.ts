export interface User {
  id: string;
  avatar?: string;
  name: string;
  email: string;
  isPremium: boolean;
  level: number;
  xp: number;
  streak: number;
}
