import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AdminLanguage = 'zh-Hans' | 'en';
const storageKey = 'memopal.admin.language';
function preferredLanguage(): AdminLanguage {
  const saved = localStorage.getItem(storageKey);
  if (saved === 'zh-Hans' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-Hans' : 'en';
}
const LanguageContext = createContext<{ language: AdminLanguage; setLanguage: (language: AdminLanguage) => void } | null>(null);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>(preferredLanguage);
  const value = useMemo(() => ({ language, setLanguage: (next: AdminLanguage) => { localStorage.setItem(storageKey, next); setLanguageState(next); } }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAdminLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('AdminLanguageProvider is missing.');
  return value;
}
