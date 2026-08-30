export type UserRole = 'User' | 'Admin';

export interface ManagedUserDto {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  totalXp: number;
  level: number;
  isPremium: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ManagedUserUpsertRequest {
  displayName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  role?: UserRole;
  totalXp?: number;
  level?: number;
  isPremium?: boolean;
  isDeleted?: boolean;
}
