import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useWrite } from '../../api/useWrite';
import { useApi } from '../../api/ApiProvider';
import { useSession } from '../../auth/useSession';
import ConfirmPanel from './ConfirmPanel';
import Section from './Section';

// Reference types are names, not translated.
export const REFERENCE_TYPES = { WandyWhaRang: 'Wandy Wha Rang', KukkiWon: 'Kukkiwon' };

const typeName = (type) => REFERENCE_TYPES[type] ?? type;

/**
 * The Member's References (Wandy Wha Rang and Kukkiwon numbers). Instructors and Admins
 * add, edit (the number only; member-service can't change the type) and remove them.
 * At most one form or confirmation is open at a time. `readOnly` (on /profile) shows them to everyone
 * without changes.
 */
export default function ReferencesSection({ member, onChange, readOnly = false }) {
  const { t } = useTranslation();
  const api = useApi();
  const canEdit = useSession().isInstructor && !readOnly;
  // null | { kind: 'add' } | { kind: 'edit', id } | { kind: 'remove', id }
  const [panel, setPanel] = useState(null);
  const { busy, error, run: runWrite, reset } = useWrite();
  const references = member.references ?? [];

  const start = (next) => {
    reset();
    setPanel(next);
  };

  const run = (write) =>
    runWrite(async () => {
      const updated = await write();
      setPanel(null);
      onChange(updated);
    });

  const add = ({ type, reference }) => run(() => api.references.add(member.id, { type, reference }));
  const update = (id, { reference }) => run(() => api.references.update(member.id, id, { reference }));
  const remove = (id) => run(() => api.references.remove(member.id, id));

  const actions =
    canEdit && panel?.kind !== 'add' ? (
      <button type="button" className="btn-secondary" onClick={() => start({ kind: 'add' })}>
        {t('members.references.add')}
      </button>
    ) : null;

  return (
    <Section title={t('members.detail.references')} actions={actions}>
      {panel?.kind === 'add' && <ReferenceForm busy={busy} onSave={add} onCancel={() => start(null)} />}
      {references.length === 0 ? (
        <p>{t('members.detail.noReferences')}</p>
      ) : (
        <dl className="details references">
          {references.map((reference) => {
            const name = typeName(reference.type);
            const isOpen = panel?.id === reference.id;
            return (
              <div key={reference.id} className="reference">
                <dt>{name}</dt>
                {isOpen && panel.kind === 'edit' ? (
                  <dd>
                    <ReferenceForm
                      initial={reference}
                      busy={busy}
                      onSave={(values) => update(reference.id, values)}
                      onCancel={() => start(null)}
                    />
                  </dd>
                ) : (
                  <dd>{reference.reference}</dd>
                )}
                {isOpen && panel.kind === 'remove' && (
                  <dd>
                    <ConfirmPanel
                      message={t('members.references.removeConfirm', { type: name, reference: reference.reference })}
                      confirmLabel={t('members.references.confirmRemove')}
                      busy={busy}
                      onConfirm={() => remove(reference.id)}
                      onCancel={() => start(null)}
                    />
                  </dd>
                )}
                {canEdit && !isOpen && (
                  <dd className="actions">
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      aria-label={t('members.references.editLabel', { type: name })}
                      onClick={() => start({ kind: 'edit', id: reference.id })}
                    >
                      {t('members.references.edit')}
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-small"
                      aria-label={t('members.references.removeLabel', { type: name })}
                      onClick={() => start({ kind: 'remove', id: reference.id })}
                    >
                      {t('members.references.remove')}
                    </button>
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      )}
      <ApiErrorMessage error={error} />
    </Section>
  );
}

/** Add form (type and number) or, given `initial`, edit form (number only). */
function ReferenceForm({ initial, busy, onSave, onCancel }) {
  const { t } = useTranslation();
  const id = useId();
  const [type, setType] = useState(initial?.type ?? 'WandyWhaRang');
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [missing, setMissing] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) {
      setMissing(true);
      return;
    }
    onSave({ type, reference: trimmed });
  };

  return (
    <form className="panel-form reference-form" onSubmit={submit} noValidate>
      {!initial && (
        <>
          <label htmlFor={`${id}-type`}>{t('members.references.type')}</label>
          <select id={`${id}-type`} value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(REFERENCE_TYPES).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </>
      )}
      <label htmlFor={`${id}-number`}>{t('members.references.number')}</label>
      <input
        id={`${id}-number`}
        value={reference}
        required
        aria-invalid={missing || undefined}
        aria-describedby={missing ? `${id}-missing` : undefined}
        onChange={(e) => {
          setReference(e.target.value);
          setMissing(false);
        }}
      />
      {missing && (
        <p id={`${id}-missing`} className="field-error">
          {t('members.references.numberRequired')}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {t('app.save')}
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
          {t('app.cancel')}
        </button>
      </div>
    </form>
  );
}
