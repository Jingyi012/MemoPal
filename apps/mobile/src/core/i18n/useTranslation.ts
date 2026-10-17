import { useUserState } from '@/contexts/UserStateContext';
import { resolveLanguage, translations, type TranslationNamespace } from './i18n';

export function useTranslation<N extends TranslationNamespace>(namespace: N) {
  const { userState } = useUserState();
  const language = resolveLanguage(userState.preferences.language);
  const t = (key: keyof typeof translations.en[N], values?: Record<string, string | number>): string => {
    const current = translations[language][namespace] as Record<string, string>;
    const fallback = translations.en[namespace] as Record<string, string>;
    const template = current[String(key)] ?? fallback[String(key)] ?? String(key);
    return values ? template.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder)) : template;
  };
  return { language, t };
}
