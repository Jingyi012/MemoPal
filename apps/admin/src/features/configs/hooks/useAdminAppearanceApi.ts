import { useMemo } from 'react';
import { adminAppearanceApi } from '../../../api/adminAppearanceApi';

export function useAdminAppearanceApi() {
  return useMemo(() => adminAppearanceApi, []);
}
