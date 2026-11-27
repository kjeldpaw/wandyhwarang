import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useWrite } from '../api/useWrite';
import { useOwnClubs } from '../auth/useOwnClubs';
import { useSession } from '../auth/useSession';
import MemberForm, { personalDetailsOf } from './MemberForm';

/** /members/new: an Instructor or Admin registers a Member; member-service sends them a set-password email. */
export default function NewMemberPage() {
  const { isInstructor } = useSession();
  if (!isInstructor) return <ApiErrorMessage error={{ kind: ERROR_KINDS.forbidden }} />;
  return <NewMember />;
}

function NewMember() {
  const { t } = useTranslation();
  const api = useApi();
  const navigate = useNavigate();
  // A new Member can join only the Clubs the Instructor works with (any Club for an Admin).
  const { data: clubs, error: loadError, loading } = useOwnClubs();
  const { busy, error, run } = useWrite();

  const create = (values) =>
    run(async () => {
      const member = await api.members.create({ ...personalDetailsOf(values), clubIds: values.clubIds });
      navigate(`/members/${member.id}`);
    });

  return (
    <section>
      <h2>{t('members.form.newTitle')}</h2>
      {loading && <p role="status">{t('app.loading')}</p>}
      <ApiErrorMessage error={loadError} />
      {clubs && (
        <MemberForm clubs={clubs} submitLabel={t('members.form.create')} onSubmit={create} busy={busy}>
          <ApiErrorMessage error={error} messages={{ conflict: t('members.form.duplicateEmail') }} />
        </MemberForm>
      )}
      <p>
        <Link to="/">{t('members.form.cancel')}</Link>
      </p>
    </section>
  );
}
