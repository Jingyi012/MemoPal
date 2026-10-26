import { useAdminLanguage } from '../../../i18n/adminLanguage';
import { translate, type EducationMessageKey } from './educationMessages';

export function useEducationText() {
  const { language, setLanguage } = useAdminLanguage();
  return { language, setLanguage, t: (key: EducationMessageKey, params?: Record<string, string | number>) => translate(language, key, params) };
}
