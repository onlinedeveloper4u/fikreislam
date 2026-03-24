'use client';

import { useLanguage } from "@/contexts/LanguageContext";

export const useHomeLogic = () => {
  const { dir, language } = useLanguage();

  return {
    dir,
    language,
  };
};
