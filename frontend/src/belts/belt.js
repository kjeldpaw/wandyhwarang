/**
 * How the app shows member-service's Belts (decisions: wandyhwarang#1).
 * member-service names a Belt like "White Belt with yellow snippet (10. KUP)"; the app
 * shows only the grade, normalised: "10. Kup", "1. Dan", "9. Mon". A name without a
 * grade in parentheses is shown as returned. Belt names are never translated.
 */
export function beltName(belt) {
  const match = belt?.name?.match(/\((\d+)\. (KUP|DAN|MON)\)\s*$/i);
  if (!match) return belt?.name ?? '';
  const [, number, unit] = match;
  return `${number}. ${unit[0].toUpperCase()}${unit.slice(1).toLowerCase()}`;
}

/** Belts in rank order, lowest first (member-service returns them unordered). */
export function sortBelts(belts) {
  return [...belts].sort((a, b) => a.rank - b.rank);
}
