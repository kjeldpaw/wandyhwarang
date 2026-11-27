import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import { useWrite } from '../api/useWrite';
import { useSession } from '../auth/useSession';
import ClubsSection from '../members/detail/ClubsSection';
import GraduationsSection from '../members/detail/GraduationsSection';
import PersonalDetailsSection from '../members/detail/PersonalDetailsSection';
import ReferencesSection from '../members/detail/ReferencesSection';
import EditPersonalDetails from '../members/EditPersonalDetails';
import MemberForm, { profileDetailsOf } from '../members/MemberForm';
import { fullName } from '../members/member';
import '../styles/MemberDetail.css';

/**
 * /profile: the logged-in person's own Member record, their Profile. They view it and edit
 * their personal details, but not their email. Clubs, Graduations and References are
 * read-only here for every role; Instructors and Admins change their own on /members/:id. Someone
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
      <PersonalDetailsSection member={profile} editAction={edit} />
      {/* Read-only for every role: Instructors and Admins change their own on /members/:id. */}
      <ClubsSection member={profile} readOnly />
      <GraduationsSection member={profile} readOnly />
      <ReferencesSection member={profile} readOnly />
    </article>
  );
}

function EditProfile({ profile, onSaved, onCancel }) {
  const { t } = useTranslation();
  const api = useApi();
  return (
    <EditPersonalDetails
      member={profile}
      emailHint={t('profile.emailHint')}
      save={async (values) => onSaved(await api.profile.update(profileDetailsOf(values)))}
      cancel={
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('app.cancel')}
        </button>
      }
    />
  );
}

function CreateProfile({ onCreated }) {
  const { t } = useTranslation();
  const api = useApi();
  const session = useSession();
  // Any Club: the person isn't a Member of one yet.
  const { data: clubs, error: loadError, loading } = useApiData((api) => api.clubs.list(), []);
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
      {/* An Admin or Instructor may work without a Member record, e.g. the first Admin made in Keycloak. */}
      {session.isInstructor && (
        <p className="page-actions">
          <Link to="/" className="btn btn-secondary">
            {t('profile.skip')}
          </Link>
        </p>
      )}
    </section>
  );
}
