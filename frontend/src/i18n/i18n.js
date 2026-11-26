import i18next from 'i18next';
import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';

/** The app's languages, in switcher order. The first is the fallback. */
export const LANGUAGES = ['da', 'en', 'de'];

/** Each language's name in itself, for the switcher. Not translated. */
export const LANGUAGE_NAMES = { da: 'Dansk', en: 'English', de: 'Deutsch' };

const STORAGE_KEY = 'language';

const supported = (tag) => {
  const language = tag?.toLowerCase().split('-')[0];
  return LANGUAGES.includes(language) ? language : undefined;
};

/** The saved choice, else the first supported browser language, else Danish. */
export function detectLanguage() {
  let saved;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = undefined; // storage blocked: fall through to the browser language
  }
  const browser = window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language];
  return supported(saved) ?? browser.map(supported).find(Boolean) ?? LANGUAGES[0];
}

/** Remembers the user's explicit choice for later visits. */
export function saveLanguage(language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
}

/** A fresh i18next instance in the detected language; keeps <html lang> in step. */
export function createI18n() {
  const i18n = i18next.createInstance();
  i18n.on('languageChanged', (language) => {
    document.documentElement.lang = language;
  });
  i18n.init({
    resources: { da: { translation: da }, en: { translation: en }, de: { translation: de } },
    lng: detectLanguage(),
    fallbackLng: LANGUAGES[0],
    supportedLngs: LANGUAGES,
    interpolation: { escapeValue: false }, // React escapes
    initAsync: false,
  });
  return i18n;
}
