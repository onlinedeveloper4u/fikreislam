import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Language = 'en' | 'ur';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    dir: Direction;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const normalizeLang = (lng: string | undefined | null): Language => {
    if (!lng) return 'ur';
    if (lng.startsWith('en')) return 'en';
    if (lng.startsWith('ur')) return 'ur';
    return 'ur';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const { i18n } = useTranslation();
    const { user, loading: authLoading } = useAuth();

    // Initialize normalized language from localStorage or default to Urdu
    const [language, setLanguageState] = useState<Language>(
        normalizeLang(localStorage.getItem('i18nextLng'))
    );
    const [dir, setDir] = useState<Direction>(language === 'ur' ? 'rtl' : 'ltr');

    // Initial sync with i18n
    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, []);

    // Fetch preference from database when user logs in or auth state finishes loading
    useEffect(() => {
        const fetchPreference = async () => {
            if (user) {
                console.log("[LanguageContext] User detected, fetching preference from DB...");
                const { data, error } = await supabase
                    .from('profiles')
                    .select('preferred_language')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error("[LanguageContext] Error fetching preference:", error);
                    return;
                }

                if (data?.preferred_language) {
                    const dbLang = normalizeLang(data.preferred_language);
                    console.log("[LanguageContext] DB preference:", dbLang, "| Current state:", language);

                    if (dbLang !== language) {
                        console.log("[LanguageContext] Syncing state to DB preference:", dbLang);
                        setLanguageState(dbLang);
                        i18n.changeLanguage(dbLang);
                    }
                }
            }
        };

        if (!authLoading) {
            fetchPreference();
        }
    }, [user?.id, authLoading]);

    // Keep direction, HTML attributes, and Metadata in sync with language state
    useEffect(() => {
        const newDir = language === 'ur' ? 'rtl' : 'ltr';
        setDir(newDir);

        // Update DOM attributes
        document.documentElement.dir = newDir;
        document.documentElement.lang = language;
        localStorage.setItem('i18nextLng', language);

        // Update Metadata (Tab Title and Description)
        const metaTitle = i18n.t('metadata.title');
        const metaDesc = i18n.t('metadata.description');
        const metaKeywords = i18n.t('metadata.keywords');

        if (metaTitle && metaTitle !== 'metadata.title') {
            document.title = metaTitle;

            // OG & Twitter Title
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

        console.log("[LanguageContext] Sync complete. Lang:", language, "| Title:", document.title);

        if (i18n.language !== language && !i18n.language?.startsWith(language)) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    const setLanguage = async (lang: Language) => {
        console.log("[LanguageSync] Manually setting language to:", lang);
        setLanguageState(lang);
        i18n.changeLanguage(lang);

        // Persist to database if logged in
        if (user) {
            console.log("[LanguageSync] Persisting preference to DB for user:", user.id);
            const { error } = await supabase
                .from('profiles')
                .update({ preferred_language: lang })
                .eq('user_id', user.id);

            if (error) {
                console.error("[LanguageSync] Error persisting preference:", error);
            } else {
                console.log("[LanguageSync] Preference persisted successfully.");
            }
        }
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
