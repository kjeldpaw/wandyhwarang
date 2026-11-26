import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from './i18n';

// One i18next instance per app mount, so the language is detected on every load.
export default function I18nProvider({ children }) {
  const [i18n] = useState(createI18n);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
