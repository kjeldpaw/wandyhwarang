import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../../api/ApiErrorMessage';

/**
 * Asks before a delete: the question, the write's error if it failed, and a confirm and a
 * Cancel button, both disabled while `busy`. Pass `error` only if nothing else shows it.
 */
export default function ConfirmPanel({ message, confirmLabel, busy, error, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <div>
      <p>{message}</p>
      <ApiErrorMessage error={error} />
      <button type="button" disabled={busy} onClick={onConfirm}>
        {confirmLabel}
      </button>{' '}
      <button type="button" disabled={busy} onClick={onCancel}>
        {t('app.cancel')}
      </button>
    </div>
  );
}
