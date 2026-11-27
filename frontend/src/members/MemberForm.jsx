import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sortClubs } from './member';
import '../styles/MemberForm.css';

/** Form values for a Member (or some of its fields): every field a string, Clubs as a list of ids. */
export const formValuesOf = (member) => ({
  firstName: member?.firstName ?? '',
  lastName: member?.lastName ?? '',
  street: member?.address?.street ?? '',
  zipCode: member?.address?.zipCode ?? '',
  city: member?.address?.city ?? '',
  phone: member?.phone ?? '',
  email: member?.email ?? '',
  dateOfBirth: member?.dateOfBirth ?? '',
  clubIds: [],
});

/** The personal details of a Member as member-service takes them (without Clubs). */
export function personalDetailsOf(values) {
  const text = (name) => values[name].trim();
  return {
    firstName: text('firstName'),
    lastName: text('lastName'),
    address: { street: text('street'), city: text('city'), zipCode: text('zipCode') },
    phone: text('phone') || null,
    email: text('email'),
    dateOfBirth: values.dateOfBirth || null,
  };
}

const REQUIRED = ['firstName', 'lastName', 'street', 'zipCode', 'city', 'email'];
// Close to what member-service's @Email accepts: something@something, no spaces, a dot in the domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Problems with the form values, as translation keys by field name (`clubIds` when Clubs are chosen).
 * A read-only email is not the person's to fix, and the caller doesn't submit it, so it isn't checked.
 */
function validate(values, { withClubs, withEmail }) {
  const errors = {};
  const required = withEmail ? REQUIRED : REQUIRED.filter((name) => name !== 'email');
  for (const name of required) if (!values[name].trim()) errors[name] = 'members.form.required';
  if (withEmail && !errors.email && !EMAIL.test(values.email.trim())) errors.email = 'members.form.invalidEmail';
  if (withClubs && values.clubIds.length === 0) errors.clubIds = 'members.form.noClub';
  return errors;
}

/**
 * The create/edit form for a Member's personal details. `clubs` (create only) are the Clubs
 * to choose from; without it the form has no Club choice. `emailReadOnly` on edit, since the
 * email is the Keycloak username; `emailHint` describes the email field, e.g. how to change it.
 * `onSubmit(values)` is called with valid form values only.
 */
export default function MemberForm({
  initial,
  clubs,
  emailReadOnly = false,
  emailHint,
  submitLabel,
  onSubmit,
  busy,
  children,
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => formValuesOf(initial));
  const [errors, setErrors] = useState({});
  const idPrefix = useId();
  const errorId = (name) => `${idPrefix}-${name}-error`;
  const errorFor = (name) =>
    errors[name] && (
      <span id={errorId(name)} className="field-error">
        {t(errors[name])}
      </span>
    );

  const set = (name) => (event) => setValues((previous) => ({ ...previous, [name]: event.target.value }));
  const toggleClub = (id) => (event) =>
    setValues((previous) => ({
      ...previous,
      clubIds: event.target.checked ? [...previous.clubIds, id] : previous.clubIds.filter((c) => c !== id),
    }));

  /** One labelled input. `input` are extra attributes for it; `hint` describes it below. */
  const field = (name, label, { input = {}, hint } = {}) => {
    const hintId = `${idPrefix}-${name}-hint`;
    const describedBy = [errors[name] && errorId(name), hint && hintId].filter(Boolean).join(' ');
    return (
      <p className="form-group">
        <label>
          {label}{' '}
          <input
            name={name}
            value={values[name]}
            onChange={set(name)}
            aria-invalid={errors[name] ? true : undefined}
            aria-describedby={describedBy || undefined}
            {...input}
          />
        </label>{' '}
        {errorFor(name)}
        {hint && (
          <span id={hintId} className="field-hint">
            {hint}
          </span>
        )}
      </p>
    );
  };

  const submit = (event) => {
    event.preventDefault();
    const problems = validate(values, { withClubs: Boolean(clubs), withEmail: !emailReadOnly });
    setErrors(problems);
    if (Object.keys(problems).length === 0) onSubmit(values);
  };

  return (
    <form className="member-form" onSubmit={submit} noValidate>
      {field('firstName', t('members.form.firstName'), { input: { autoComplete: 'given-name' } })}
      {field('lastName', t('members.form.lastName'), { input: { autoComplete: 'family-name' } })}
      {field('street', t('members.form.street'), { input: { autoComplete: 'street-address' } })}
      {field('zipCode', t('members.form.zipCode'), { input: { autoComplete: 'postal-code' } })}
      {field('city', t('members.form.city'), { input: { autoComplete: 'address-level2' } })}
      {field('phone', t('members.form.optional', { field: t('members.fields.phone') }), { input: { type: 'tel' } })}
      {field('email', t('members.fields.email'), {
        input: { type: 'email', readOnly: emailReadOnly },
        hint: emailHint,
      })}
      {field('dateOfBirth', t('members.form.optional', { field: t('members.fields.dateOfBirth') }), {
        input: { type: 'date' },
      })}
      {clubs && (
        <fieldset
          className="form-group checkbox-group"
          aria-describedby={errors.clubIds ? errorId('clubIds') : undefined}
        >
          <legend>{t('members.form.clubs')}</legend>
          {errorFor('clubIds')}
          {sortClubs(clubs).map((club) => (
            <label key={club.id} className="checkbox">
              <input type="checkbox" checked={values.clubIds.includes(club.id)} onChange={toggleClub(club.id)} />{' '}
              {club.name}
            </label>
          ))}
        </fieldset>
      )}
      {children}
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
