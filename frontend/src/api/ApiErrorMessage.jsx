import { ERROR_KINDS } from './client';

const messages = {
  [ERROR_KINDS.network]: 'Kan ikke få forbindelse til member-service. Prøv igen senere.',
  [ERROR_KINDS.unauthorised]: 'Din session er udløbet. Du sendes til login.',
  [ERROR_KINDS.forbidden]: 'Du har ikke adgang til dette.',
  [ERROR_KINDS.notFound]: 'Det findes ikke, eller du har ikke adgang til det.',
  [ERROR_KINDS.conflict]: 'Det kan ikke lade sig gøre, fordi det strider mod eksisterende data.',
  [ERROR_KINDS.validation]: 'Nogle af oplysningerne er ikke gyldige.',
  [ERROR_KINDS.server]: 'member-service fejlede. Prøv igen senere.',
};

/**
 * Shows an API error as a message for its kind. `messages` overrides the text for
 * some kinds, e.g. { conflict: 'Kontakt en Admin …' } on the create-Member form.
 */
export default function ApiErrorMessage({ error, messages: overrides = {} }) {
  if (!error) return null;
  const kind = error.kind ?? ERROR_KINDS.server;
  return <p role="alert">{overrides[kind] ?? messages[kind]}</p>;
}
