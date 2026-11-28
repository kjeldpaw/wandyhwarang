import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../api/ApiProvider';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import { useSession } from '../auth/useSession';
import NotFound from '../NotFound';
import EditPersonalDetails from './EditPersonalDetails';
import { personalDetailsOf } from './MemberForm';

/**
 * /members/:id/edit: an Instructor or Admin edits a Member's personal details (not Clubs, not
 * email). An Admin also changes the Member's Role, except their own.
 */
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
  const { isAdmin, memberId } = useSession();
  const { data: member, error: loadError, loading } = useApiData((api) => api.members.get(id), [id]);

  if (loading)
    return (
      <p role="status" className="loading">
        {t('app.loading')}
      </p>
    );
  if (loadError?.kind === ERROR_KINDS.notFound) return <NotFound message={t('members.detail.notFound')} />;
  if (loadError) return <ApiErrorMessage error={loadError} />;

  // member-service sends the Role to Admins only, and has none for a Member without a login.
  const withRole = isAdmin && Boolean(member.role);
  const own = member.id === memberId;

  // member-service requires the email but ignores it: it is the login and can't change.
  // The Role is a call of its own, made only when it changed; a failure of either stops here.
  const save = async (values) => {
    await api.members.update(id, { ...personalDetailsOf(values), email: member.email });
    if (withRole && !own && values.role !== member.role) await api.members.updateRole(id, values.role);
    navigate(`/members/${id}`);
  };

  return (
    <EditPersonalDetails
      member={member}
      role={withRole ? { disabled: own, hint: own ? t('members.form.ownRole') : undefined } : undefined}
      save={save}
      cancel={
        <Link to={`/members/${id}`} className="btn btn-secondary">
          {t('app.cancel')}
        </Link>
      }
    />
  );
}
