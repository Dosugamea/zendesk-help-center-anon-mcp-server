import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lang = process.env.LANG || 'ja'; // Default to Japanese if LANG is not set

// Initialize i18next and export the promise
export const i18nPromise = i18next
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

// Export i18next instance directly for convenience,
// but ensure init is complete before using t() extensively at startup
export default i18next;
