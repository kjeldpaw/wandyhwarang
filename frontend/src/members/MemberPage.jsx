import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import NotFound from '../NotFound';
import ClubsSection from './detail/ClubsSection';
import DeleteMember from './detail/DeleteMember';
import GraduationsSection from './detail/GraduationsSection';
import PersonalDetailsSection from './detail/PersonalDetailsSection';
import ReferencesSection from './detail/ReferencesSection';
import { fullName } from './member';
import '../styles/MemberDetail.css';

/**
 * A Member's detail page (/members/:id). It loads the Member and lays out one section per
 * part of the record. Each section gets the Member and `onChange(updatedMember)`: every
 * member-service write on a Member resolves with the whole updated Member, so a section
 * that writes passes that result to onChange and the page re-renders all sections. Those
 * results carry no Role, so the page keeps the one it loaded. Right after the Member is
 * created (router state `created: { id, email }` from /members/new) it says so, until the
 * person leaves the page.
 */
export default function MemberPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: member, error, loading, setData: setMember } = useApiData((api) => api.members.get(id), [id]);
  const location = useLocation();
  const navigate = useNavigate();
  const [created] = useState(() => location.state?.created);
  // Drop the router state, so going back to this page or reloading it doesn't say it again.
  useEffect(() => {
    if (location.state?.created) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <p role="status" className="loading">
        {t('app.loading')}
      </p>
    );
  if (error?.kind === ERROR_KINDS.notFound) return <NotFound message={t('members.detail.notFound')} />;
  if (error) return <ApiErrorMessage error={error} />;

  const onChange = (updated) => setMember({ ...updated, role: member.role });
  return (
    <article className="card member-detail">
      <h2>{fullName(member)}</h2>
      {created?.id === member.id && (
        <p role="status" className="notice">
          {t('members.detail.created', { email: created.email })}
        </p>
      )}
      <DeleteMember member={member} />
      <PersonalDetailsSection member={member} onChange={onChange} />
      <ClubsSection member={member} onChange={onChange} />
      <GraduationsSection member={member} onChange={onChange} />
      <ReferencesSection member={member} onChange={onChange} />
    </article>
  );
}
