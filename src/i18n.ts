import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import urTranslations from './locales/ur.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ur: { translation: urTranslations },
        },
        lng: 'ur',
        fallbackLng: 'ur',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
