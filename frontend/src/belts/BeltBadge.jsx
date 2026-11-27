import { beltColours } from './belt';

/** A small drawing of a Belt's colours, shown beside its name. Decorative: the name says the grade. */
export default function BeltBadge({ belt, large = false }) {
  const colours = beltColours(belt);
  if (!colours) return null;
  return (
    <span className={`belt-badge belt-${colours.base}${large ? ' belt-badge-large' : ''}`} aria-hidden="true">
      {colours.stripes.map((stripe, index) => (
        <span key={index} className={`belt-stripe belt-${stripe}`} />
      ))}
    </span>
  );
}
