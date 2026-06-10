import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationPT from './locales/pt/translation.json';
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';

const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['pt', 'en'],
    fallbackLng: 'pt',
    detection: {
      order: ['localStorage'], // Apenas usa o localStorage, ignora o idioma do navegador para forçar PT por padrão
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false 
    }
  });

if (i18n.language?.startsWith('es')) {
  void i18n.changeLanguage('pt');
}

export default i18n;
