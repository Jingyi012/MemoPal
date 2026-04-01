import { useCallback } from 'react';
import { authApi } from '../api/authApi';

export function useAuthApi() {
  const login = useCallback(
    (email: string, password: string) => authApi.login(email, password),
    [],
  );

  const me = useCallback(() => authApi.me(), []);

  return {
    login,
    me,
  };
}
