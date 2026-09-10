import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { ta } from './ta';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, any>) => string;
  formatLocalizedDate: (date?: Date | string) => string;
}

const translations: Record<Language, any> = { en, ta };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('shanker_language');
      if (saved === 'ta' || saved === 'en') {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for language preference:', e);
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('shanker_language', lang);
    } catch (e) {
      console.warn('Unable to save language preference to localStorage:', e);
    }
  };

  const t = (path: string, params?: Record<string, any>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key missing in Tamil
        let fallback: any = translations.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return result;
  };

  const formatLocalizedDate = (dateVal?: Date | string): string => {
    if (!dateVal) return '';
    const dateObj = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(dateObj.getTime())) return '';

    try {
      const locale = language === 'ta' ? 'ta-IN' : 'en-IN';
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(dateObj);
    } catch (e) {
      return dateObj.toLocaleDateString('en-IN');
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatLocalizedDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

