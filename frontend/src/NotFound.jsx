import { useTranslation } from 'react-i18next';

/** A translated not-found page; `message` says what wasn't found (default: the page). */
export default function NotFound({ message }) {
  const { t } = useTranslation();
  return (
    <section>
      <h2>{t('notFound.title')}</h2>
      <p>{message ?? t('notFound.page')}</p>
    </section>
  );
}
