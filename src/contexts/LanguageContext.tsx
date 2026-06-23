import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations, Language } from '../utils/translations';
// 1. ტიპების განახლება
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void; // <--- ეს აკლდა
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ნაგულისხმევი ენა (შეგიძლიათ შეცვალოთ 'en'-ზე თუ გინდათ)
  const [language, setLanguage] = useState<Language>('ka');

  // 2. ფუნქციის იმპლემენტაცია
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ka' ? 'en' : 'ka'));
  };

  // თარგმანის ფუნქცია
  const t = (key: string): string => {
    const translation = (translations[language] as Record<string, string>)[key];
    return translation || key; // თუ თარგმანი არ არის, აბრუნებს გასაღებს
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};