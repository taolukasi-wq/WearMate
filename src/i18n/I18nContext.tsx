import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Language } from './types';
import { translations } from './translations';

const STORAGE_KEY = 'wearmate_language';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['zh-CN'], vars?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-CN';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && (stored === 'zh-CN' || stored === 'en')) return stored;

  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) return 'zh-CN';
  return 'zh-CN'; // Default to Chinese as requested
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const t = useCallback(
    (key: keyof typeof translations['zh-CN'], vars?: Record<string, string | number>) => {
      let text = translations[language][key] || translations['zh-CN'][key] || key;
      if (vars) {
        Object.entries(vars).forEach(([varKey, value]) => {
          text = text.replace(new RegExp(`\\{\\{${varKey}\\}\\}`, 'g'), String(value));
        });
      }
      return text;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}
