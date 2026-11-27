import { useTranslation } from 'react-i18next';
import { ERROR_KINDS } from './client';

/**
 * Shows an API error as the translated message for its kind (`errors.<kind>` in the
 * locale files), never member-service's text. `messages` overrides the text for some
 * kinds, e.g. { conflict: t('members.create.duplicateEmail') } on the create-Member form.
 */
export default function ApiErrorMessage({ error, messages: overrides = {} }) {
  const { t } = useTranslation();
  if (!error) return null;
  const kind = ERROR_KINDS[error.kind] ?? ERROR_KINDS.server;
  return (
    <p role="alert" className="error-message">
      {overrides[kind] ?? t(`errors.${kind}`)}
    </p>
  );
}
