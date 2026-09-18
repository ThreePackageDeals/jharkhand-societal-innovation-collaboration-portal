import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { Language, translations } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, ...args: Array<string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem('samadhan-language');
    return savedLanguage === 'hi' ? 'hi' : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem('samadhan-language', language);
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const t = useCallback((key: string, ...args: Array<string | number>) => {
    let translation = translations[language][key] || translations['en'][key] || key;
    args.forEach((arg, i) => {
      translation = translation.replace(`%s`, String(arg));
    });
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
