import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import { useWrite } from '../api/useWrite';
import { useSession } from '../auth/useSession';
import NotFound from '../NotFound';
import MemberForm, { personalDetailsOf } from './MemberForm';
import { fullName } from './member';

/** /members/:id/edit: an Instructor or Admin edits a Member's personal details (not Clubs, not email). */
export default function EditMemberPage() {
  const { isInstructor } = useSession();
  if (!isInstructor) return <ApiErrorMessage error={{ kind: ERROR_KINDS.forbidden }} />;
  return <EditMember />;
}

function EditMember() {
  const { t } = useTranslation();
  const api = useApi();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: member, error: loadError, loading } = useApiData((client) => client.members.get(id), [id]);
  const { busy, error, run } = useWrite();

  if (loading) return <p role="status">{t('app.loading')}</p>;
  if (loadError?.kind === ERROR_KINDS.notFound) return <NotFound message={t('members.detail.notFound')} />;
  if (loadError) return <ApiErrorMessage error={loadError} />;

  const save = (values) =>
    run(async () => {
      // member-service requires the email but ignores it: it is the login and can't change.
      await api.members.update(id, { ...personalDetailsOf(values), email: member.email });
      navigate(`/members/${id}`);
    });

  return (
    <section>
      <h2>{t('members.form.editTitle', { name: fullName(member) })}</h2>
      <MemberForm initial={member} emailReadOnly submitLabel={t('members.form.save')} onSubmit={save} busy={busy}>
        <ApiErrorMessage error={error} />
      </MemberForm>
      <p>
        <Link to={`/members/${id}`}>{t('members.form.cancel')}</Link>
      </p>
    </section>
  );
}
