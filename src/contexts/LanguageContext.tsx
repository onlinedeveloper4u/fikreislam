"use client";
import React, { createContext, useContext, useEffect, ReactNode } from 'react';

type Direction = 'rtl';

interface LanguageContextType {
    language: 'ur';
    dir: Direction;
    toggleLanguage: () => void;
    setLanguage: (lang: 'ur') => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    // Keep direction, HTML attributes, and Metadata in sync
    useEffect(() => {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ur';

        // Update Metadata (Tab Title and Description)
        const metaTitle = "فکر اسلام | اسلامی کتب، آڈیو اور ویڈیو لائبریری";
        const metaDesc = "مستند اسلامی مواد دریافت کریں جس میں کتب، قرآنی تلاوت، خطبات اور تعلیمی ویڈیوز شامل ہیں۔";
        const metaKeywords = "اسلامی کتب، قرآن، اسلامی آڈیو، اسلامی خطبات، اسلامی تعلیم، مسلم وسائل";

        document.title = metaTitle;
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', metaTitle);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', metaTitle);

        document.querySelector('meta[name="description"]')?.setAttribute('content', metaDesc);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', metaDesc);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', metaDesc);

        document.querySelector('meta[name="keywords"]')?.setAttribute('content', metaKeywords);
    }, []);

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
