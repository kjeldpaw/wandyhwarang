import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from './ApiProvider';
import { clearDraft, readDraft, saveDraft } from './drafts';

/**
 * Keeps a form's values across a trip to the Keycloak login (see drafts.js).
 *   const { values, restored, keep } = useFormDraft(key);
 *   useState(() => values ?? fromProps)          start from the kept values, if any
 *   keep(current, () => onSave(current))          submit: keeps `current` while the write runs
 *   {restored && <DraftRestored action={label} />}
 * `key` is unique per form (undefined: nothing is kept). `context` is stored with the values,
 * for the code that decides which form to open, e.g. a section's panel; read it with
 * openDraft(key). If the write loses the session, the browser leaves with the values kept; any
 * other outcome drops them. Back on the form, the values are read once and dropped from storage.
 */
export function useFormDraft(key, context) {
  const api = useApi();
  const [draft] = useState(() => (key ? readDraft(key) : undefined));
  const [restored, setRestored] = useState(Boolean(draft));
  useEffect(() => {
    if (draft) clearDraft(key);
  }, [draft, key]);

  const keep = (values, write) => {
    setRestored(false);
    if (!key) return write();
    saveDraft(key, { context, values });
    return Promise.resolve(write()).finally(() => {
      if (!api.sessionLost()) clearDraft(key);
    });
  };

  return { values: draft?.values, restored, keep };
}

/** The `context` kept with a form's values, or undefined when there are none. */
export const openDraft = (key) => readDraft(key)?.context;

/** Tells the person their values are back after the login and what to click. */
export function DraftRestored({ action }) {
  const { t } = useTranslation();
  return (
    <p role="alert" className="notice">
      {t('app.sessionRestored', { action })}
    </p>
  );
}
