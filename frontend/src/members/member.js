// Small helpers for showing Members (and Examiners, which share the name fields).

export const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

/** Sorts by last name, then first name, in Danish collation. */
export const byName = (a, b) =>
  a.lastName.localeCompare(b.lastName, 'da') || a.firstName.localeCompare(b.firstName, 'da');

/** Clubs sorted by name. */
export const sortClubs = (clubs) => [...clubs].sort((a, b) => a.name.localeCompare(b.name, 'da'));

/** A Member's current Belt: the Belt of their latest Graduation, or undefined. */
export const currentBelt = (member) => member.graduation?.belt;

/** A Member's Graduation history, latest first, walked from member.graduation. */
export function graduationHistory(member) {
  const history = [];
  for (let graduation = member.graduation; graduation; graduation = graduation.previousGraduation) {
    history.push(graduation);
  }
  return history;
}
