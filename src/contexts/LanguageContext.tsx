import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'en' | 'ur';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    dir: Direction;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const { i18n } = useTranslation();
    const [language, setLanguageState] = useState<Language>(i18n.language as Language || 'ur');
    const [dir, setDir] = useState<Direction>(i18n.language === 'ur' ? 'rtl' : 'ltr');

    useEffect(() => {
        const currentLang = i18n.language || 'ur';
        const newLang = currentLang.startsWith('ur') ? 'ur' : 'en';
        setLanguageState(newLang);
        setDir(newLang === 'ur' ? 'rtl' : 'ltr');

        // Update HTML attributes
        document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
    }, [i18n.language]);

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ur' : 'en';
        setLanguage(newLang);
    };

    return (
        <LanguageContext.Provider value={{ language, dir, toggleLanguage, setLanguage }}>
            <div className={language === 'ur' ? 'font-urdu' : ''}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
