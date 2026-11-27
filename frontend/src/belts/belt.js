/**
 * How the app shows member-service's Belts (decisions: wandyhwarang#1).
 * member-service names a Belt like "White Belt with yellow snippet (10. KUP)"; the app
 * shows only its Kup, Poom, Dan or Mon number, normalised: "10. Kup", "1. Poom", "1. Dan",
 * "9. Mon". A name without one in parentheses is shown as returned. Belt names are never
 * translated.
 */
const GRADE = /\((\d+)\. (KUP|POOM|DAN|MON)\)\s*$/i;

export function beltName(belt) {
  const match = belt?.name?.match(GRADE);
  if (!match) return belt?.name ?? '';
  const [, number, unit] = match;
  return `${number}. ${unit[0].toUpperCase()}${unit.slice(1).toLowerCase()}`;
}

/** Belts in rank order, lowest first (member-service returns them unordered). */
export function sortBelts(belts) {
  return [...belts].sort((a, b) => a.rank - b.rank);
}

// Kup and Mon colours by grade number (decisions: wandyhwarang#19): the belt's colour and its snippets.
const KUP_COLOURS = {
  10: ['white', ['yellow']],
  9: ['yellow', []],
  8: ['orange', []],
  7: ['green', []],
  6: ['blue', []],
  5: ['blue', ['red']],
  4: ['red', []],
  3: ['red', ['black']],
  2: ['red', ['black', 'black']],
  1: ['red', ['black', 'black', 'black']],
};

/**
 * The colours to draw a Belt in: `{ base, stripes }`, e.g. `{ base: 'blue', stripes: ['red'] }`,
 * or null when its name has no known grade. Taken from the Kup, Mon or Dan number, never from the
 * colour words in the name. A Mon has the colours of the Kup with the same number; every Dan is black;
 * every Poom is the traditional half-red, half-black belt, base 'red-black'.
 */
export function beltColours(belt) {
  const match = belt?.name?.match(GRADE);
  if (!match) return null;
  const [, number, unit] = match;
  if (unit.toUpperCase() === 'DAN') return { base: 'black', stripes: [] };
  if (unit.toUpperCase() === 'POOM') return { base: 'red-black', stripes: [] };
  const colours = KUP_COLOURS[Number(number)];
  if (!colours) return null;
  const [base, stripes] = colours;
  return { base, stripes };
}
