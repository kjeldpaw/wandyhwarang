import { useTranslation } from 'react-i18next';
import { LANGUAGE_NAMES, LANGUAGES, saveLanguage } from './i18n';

// Switches the UI language at once and remembers the choice for later visits.
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const choose = (event) => {
    const language = event.target.value;
    saveLanguage(language);
    i18n.changeLanguage(language);
  };

  return (
    <label className="language-switcher">
      <span className="language-label">{t('header.language')}</span>{' '}
      <select value={i18n.resolvedLanguage} onChange={choose}>
        {LANGUAGES.map((language) => (
          <option key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </select>
    </label>
  );
}
