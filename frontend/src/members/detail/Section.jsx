import { useId } from 'react';

/** A titled part of the Member detail page: a region named by its heading. `actions` go beside the heading. */
export default function Section({ title, actions, children }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="detail-section">
      <div className="section-header">
        <h3 id={headingId}>{title}</h3>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
