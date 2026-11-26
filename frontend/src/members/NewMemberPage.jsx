import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { useApiData } from '../api/useApiData';
import { useSession } from '../auth/useSession';
import MemberForm, { personalDetailsOf } from './MemberForm';

// Clubs a new Member can join: an Admin any Club, an Instructor the Clubs of their own Member record.
const clubChoices = (api, session) =>
  session.isAdmin ? api.clubs.list() : api.members.get(session.memberId).then((own) => own.clubs);

/** /members/new: an Instructor or Admin registers a Member; member-service sends them a set-password email. */
export default function NewMemberPage() {
  const { t } = useTranslation();
  const api = useApi();
  const session = useSession();
  const navigate = useNavigate();
  const { data: clubs, error: loadError, loading } = useApiData(
    (client) => clubChoices(client, session),
    [session.isAdmin, session.memberId],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState();

  const create = async (values) => {
    setSaving(true);
    setError(undefined);
    try {
      const member = await api.members.create({ ...personalDetailsOf(values), clubIds: values.clubIds });
      navigate(`/members/${member.id}`);
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  };

  return (
    <section>
      <h2>{t('members.form.newTitle')}</h2>
      {loading && <p role="status">{t('app.loading')}</p>}
      <ApiErrorMessage error={loadError} />
      {clubs && (
        <MemberForm clubs={clubs} submitLabel={t('members.form.create')} onSubmit={create} busy={saving}>
          <ApiErrorMessage error={error} messages={{ conflict: t('members.form.duplicateEmail') }} />
        </MemberForm>
      )}
      <p>
        <Link to="/">{t('members.form.cancel')}</Link>
      </p>
    </section>
  );
}
