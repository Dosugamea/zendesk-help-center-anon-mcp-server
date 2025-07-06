import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

const lang = process.env.LANG || 'ja'; // Default to Japanese if LANG is not set

i18next
  .use(Backend)
  .init({
    fallbackLng: 'ja', // Fallback to Japanese if a translation is missing in the current language
    lng: lang,         // Set the language from the LANG environment variable
    supportedLngs: ['en', 'ja'], // Supported languages
    ns: ['translation'], // Namespace for translations
    defaultNS: 'translation',
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}.json'), // Path to translation files
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18next;
