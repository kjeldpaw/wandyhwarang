import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useWrite } from '../../api/useWrite';
import { useApi } from '../../api/ApiProvider';
import { useSession } from '../../auth/useSession';
import Section from './Section';

// Reference types are names, not translated.
export const REFERENCE_TYPES = { WandyWhaRang: 'Wandy Wha Rang', KukkiWon: 'Kukkiwon' };

const typeName = (type) => REFERENCE_TYPES[type] ?? type;

/**
 * The Member's References (Wandy Wha Rang and Kukkiwon numbers). Instructors and Admins
 * add, edit (the number only; member-service can't change the type) and remove them.
 * At most one form or confirmation is open at a time.
 */
export default function ReferencesSection({ member, onChange }) {
  const { t } = useTranslation();
  const api = useApi();
  const { isInstructor } = useSession();
  // null | { kind: 'add' } | { kind: 'edit', id } | { kind: 'remove', id }
  const [open, setOpen] = useState(null);
  const { busy, error, run: runWrite, reset } = useWrite();
  const references = member.references ?? [];

  const start = (next) => {
    reset();
    setOpen(next);
  };

  const run = (write) =>
    runWrite(async () => {
      const updated = await write();
      setOpen(null);
      onChange(updated);
    });

  const add = ({ type, reference }) => run(() => api.references.add(member.id, { type, reference }));
  const update = (id, { reference }) => run(() => api.references.update(member.id, id, { reference }));
  const remove = (id) => run(() => api.references.remove(member.id, id));

  const actions =
    isInstructor && open?.kind !== 'add' ? (
      <button type="button" onClick={() => start({ kind: 'add' })}>
        {t('members.references.add')}
      </button>
    ) : null;

  return (
    <Section title={t('members.detail.references')} actions={actions}>
      {open?.kind === 'add' && <ReferenceForm busy={busy} onSave={add} onCancel={() => start(null)} />}
      {references.length === 0 ? (
        <p>{t('members.detail.noReferences')}</p>
      ) : (
        <dl>
          {references.map((reference) => {
            const name = typeName(reference.type);
            const isOpen = open?.id === reference.id;
            return (
              <div key={reference.id}>
                <dt>{name}</dt>
                {isOpen && open.kind === 'edit' ? (
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
                {isOpen && open.kind === 'remove' && (
                  <dd>
                    <p>{t('members.references.removeConfirm', { type: name, reference: reference.reference })}</p>
                    <button type="button" disabled={busy} onClick={() => remove(reference.id)}>
                      {t('members.references.confirmRemove')}
                    </button>
                    <button type="button" disabled={busy} onClick={() => start(null)}>
                      {t('app.cancel')}
                    </button>
                  </dd>
                )}
                {isInstructor && !isOpen && (
                  <dd>
                    <button
                      type="button"
                      aria-label={t('members.references.editLabel', { type: name })}
                      onClick={() => start({ kind: 'edit', id: reference.id })}
                    >
                      {t('members.references.edit')}
                    </button>
                    <button
                      type="button"
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
    <form onSubmit={submit} noValidate>
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
      {missing && <p id={`${id}-missing`}>{t('members.references.numberRequired')}</p>}
      <button type="submit" disabled={busy}>
        {t('app.save')}
      </button>
      <button type="button" disabled={busy} onClick={onCancel}>
        {t('app.cancel')}
      </button>
    </form>
  );
}
