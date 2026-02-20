import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Direction = 'rtl';

interface LanguageContextType {
    language: 'ur';
    dir: Direction;
    toggleLanguage: () => void;
    setLanguage: (lang: 'ur') => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const { i18n } = useTranslation();

    // Keep direction, HTML attributes, and Metadata in sync
    useEffect(() => {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ur';
        localStorage.setItem('i18nextLng', 'ur');

        // Update Metadata (Tab Title and Description)
        const metaTitle = i18n.t('metadata.title');
        const metaDesc = i18n.t('metadata.description');
        const metaKeywords = i18n.t('metadata.keywords');

        if (metaTitle && metaTitle !== 'metadata.title') {
            document.title = metaTitle;
            document.querySelector('meta[property="og:title"]')?.setAttribute('content', metaTitle);
            document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', metaTitle);
        }

        if (metaDesc && metaDesc !== 'metadata.description') {
            document.querySelector('meta[name="description"]')?.setAttribute('content', metaDesc);
            document.querySelector('meta[property="og:description"]')?.setAttribute('content', metaDesc);
            document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', metaDesc);
        }

        if (metaKeywords && metaKeywords !== 'metadata.keywords') {
            document.querySelector('meta[name="keywords"]')?.setAttribute('content', metaKeywords);
        }

        if (i18n.language !== 'ur') {
            i18n.changeLanguage('ur');
        }
    }, [i18n]);

    // No-op functions since we're Urdu-only now
    const toggleLanguage = () => { };
    const setLanguage = () => { };

    return (
        <LanguageContext.Provider value={{ language: 'ur', dir: 'rtl', toggleLanguage, setLanguage }}>
            <div className="font-urdu">
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
