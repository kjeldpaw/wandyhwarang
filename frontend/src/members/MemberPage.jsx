import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
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
 * results carry no Role, so the page keeps the one it loaded.
 */
export default function MemberPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: member, error, loading, setData: setMember } = useApiData((api) => api.members.get(id), [id]);

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
      <DeleteMember member={member} />
      <PersonalDetailsSection member={member} onChange={onChange} />
      <ClubsSection member={member} onChange={onChange} />
      <GraduationsSection member={member} onChange={onChange} />
      <ReferencesSection member={member} onChange={onChange} />
    </article>
  );
}
