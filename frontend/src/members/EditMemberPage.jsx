import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import NotFound from '../NotFound';
import MemberForm, { personalDetailsOf } from './MemberForm';
import { fullName } from './member';

/** /members/:id/edit: an Instructor or Admin edits a Member's personal details (not Clubs, not email). */
export default function EditMemberPage() {
  const { t } = useTranslation();
  const api = useApi();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: member, error: loadError, loading } = useApiData((client) => client.members.get(id), [id]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState();

  if (loading) return <p role="status">{t('app.loading')}</p>;
  if (loadError?.kind === ERROR_KINDS.notFound) return <NotFound message={t('members.detail.notFound')} />;
  if (loadError) return <ApiErrorMessage error={loadError} />;

  const save = async (values) => {
    setSaving(true);
    setError(undefined);
    try {
      // member-service requires the email but ignores it: it is the login and can't change.
      await api.members.update(id, { ...personalDetailsOf(values), email: member.email });
      navigate(`/members/${id}`);
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  };

  return (
    <section>
      <h2>{t('members.form.editTitle', { name: fullName(member) })}</h2>
      <MemberForm initial={member} emailReadOnly submitLabel={t('members.form.save')} onSubmit={save} busy={saving}>
        <ApiErrorMessage error={error} />
      </MemberForm>
      <p>
        <Link to={`/members/${id}`}>{t('members.form.cancel')}</Link>
      </p>
    </section>
  );
}
