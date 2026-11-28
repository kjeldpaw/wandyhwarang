/**
 * Form values kept across a trip to the Keycloak login. A form saves its values here as it
 * submits; if the session can't be renewed, the browser leaves for the login and comes back
 * to the same route, where the form finds them again. sessionStorage: one tab only, gone
 * when the tab closes.
 *   saveDraft(key, values)  before a write
 *   readDraft(key)          values or undefined
 *   clearDraft(key)         once the write is done, or the values are back on the form
 *   clearDrafts()           on logout
 */
const PREFIX = 'wandywharang.draft:';

export function saveDraft(key, values) {
  sessionStorage.setItem(PREFIX + key, JSON.stringify(values));
}

export function readDraft(key) {
  const stored = sessionStorage.getItem(PREFIX + key);
  if (stored === null) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

export function clearDraft(key) {
  sessionStorage.removeItem(PREFIX + key);
}

export function clearDrafts() {
  for (const key of Object.keys(sessionStorage)) if (key.startsWith(PREFIX)) sessionStorage.removeItem(key);
}
