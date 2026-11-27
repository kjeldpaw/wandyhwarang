import BeltBadge from './BeltBadge';
import { beltName } from './belt';

/** A Belt as lists and histories show it: its badge, then its normalised name. */
export default function BeltName({ belt }) {
  return (
    <span className="belt-name">
      <BeltBadge belt={belt} />
      {beltName(belt)}
    </span>
  );
}
