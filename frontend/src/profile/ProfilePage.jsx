import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import { useWrite } from '../api/useWrite';
import { useSession } from '../auth/useSession';
import PersonalDetailsSection from '../members/detail/PersonalDetailsSection';
import Section from '../members/detail/Section';
import MemberForm, { personalDetailsOf } from '../members/MemberForm';
import { fullName, sortClubs } from '../members/member';
import '../styles/MemberDetail.css';

/** A Profile as member-service takes it: the personal details without the email, which is the login. */
export function profileDetailsOf(values) {
  const { email: _, ...details } = personalDetailsOf(values);
  return details;
}

/**
 * /profile: the logged-in person's own Member record, their Profile. They view it and edit
 * their personal details, but not their email, Clubs, Graduations or References. Someone
 * who logs in without a Member record (member-service answers 404) creates their Profile here.
 */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, error, loading, setData: setProfile } = useApiData((api) => api.profile.get(), []);
  const [editing, setEditing] = useState(false);

  if (loading)
    return (
      <p role="status" className="loading">
        {t('app.loading')}
      </p>
    );
  if (error?.kind === ERROR_KINDS.notFound) return <CreateProfile onCreated={setProfile} />;
  if (error) return <ApiErrorMessage error={error} />;

  if (editing)
    return (
      <EditProfile
        profile={profile}
        onSaved={(saved) => {
          setProfile(saved);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );

  const edit = (
    <button type="button" className="btn btn-edit" onClick={() => setEditing(true)}>
      {t('members.form.edit')}
    </button>
  );
  return (
    <article className="card member-detail">
      <h2>{fullName(profile)}</h2>
      <PersonalDetailsSection member={profile} actions={edit} />
      <Section title={t('members.detail.clubs')}>
        <ul className="item-list">
          {sortClubs(profile.clubs).map((club) => (
            <li key={club.id}>
              <span>{club.name}</span>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}

function EditProfile({ profile, onSaved, onCancel }) {
  const { t } = useTranslation();
  const api = useApi();
  const { busy, error, run } = useWrite();

  const save = (values) => run(async () => onSaved(await api.profile.update(profileDetailsOf(values))));

  return (
    <section className="card form-page">
      <h2>{t('members.form.editTitle', { name: fullName(profile) })}</h2>
      <MemberForm
        initial={profile}
        emailReadOnly
        emailHint={t('profile.emailHint')}
        submitLabel={t('app.save')}
        onSubmit={save}
        busy={busy}
      >
        <ApiErrorMessage error={error} />
      </MemberForm>
      <p className="page-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('app.cancel')}
        </button>
      </p>
    </section>
  );
}

function CreateProfile({ onCreated }) {
  const { t } = useTranslation();
  const api = useApi();
  const session = useSession();
  // Any Club: the person isn't a Member of one yet.
  const { data: clubs, error: loadError, loading } = useApiData((client) => client.clubs.list(), []);
  const { busy, error, run } = useWrite();
  const fromLogin = { firstName: session.firstName, lastName: session.lastName, email: session.email };

  const create = (values) =>
    run(async () => onCreated(await api.profile.create({ ...profileDetailsOf(values), clubIds: values.clubIds })));

  return (
    <section className="card form-page">
      <h2>{t('profile.createTitle')}</h2>
      <p>{t('profile.createIntro')}</p>
      {loading && (
        <p role="status" className="loading">
          {t('app.loading')}
        </p>
      )}
      <ApiErrorMessage error={loadError} />
      {clubs && (
        <MemberForm
          initial={fromLogin}
          clubs={clubs}
          emailReadOnly
          emailHint={t('profile.emailHint')}
          submitLabel={t('profile.create')}
          onSubmit={create}
          busy={busy}
        >
          <ApiErrorMessage error={error} messages={{ conflict: t('profile.conflict') }} />
        </MemberForm>
      )}
    </section>
  );
}
