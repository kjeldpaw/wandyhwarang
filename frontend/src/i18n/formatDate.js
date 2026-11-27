import { useTranslation } from 'react-i18next';

// Intl locale per app language. English uses British day-month order, as in Europe.
const LOCALES = { da: 'da-DK', en: 'en-GB', de: 'de-DE' };

/**
 * Writes an ISO date from member-service ('2024-03-03') out in `language`:
 * '3. marts 2024', '3 March 2024', '3. März 2024'. Empty for a missing date.
 */
export function formatDate(isoDate, language) {
  if (!isoDate) return '';
  // Read and write the date in UTC, so the local time zone can't move it a day.
  return new Intl.DateTimeFormat(LOCALES[language] ?? language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** formatDate in the current UI language: const formatDate = useFormatDate(); formatDate(member.dateOfBirth) */
export function useFormatDate() {
  const { i18n } = useTranslation();
  return (isoDate) => formatDate(isoDate, i18n.resolvedLanguage);
}
