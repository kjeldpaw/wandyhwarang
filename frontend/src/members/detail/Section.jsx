import { useId } from 'react';

/** A titled part of the Member detail page: a region named by its heading. `actions` go beside the heading. */
export default function Section({ title, actions, children }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId}>{title}</h3>
      {actions}
      {children}
    </section>
  );
}
