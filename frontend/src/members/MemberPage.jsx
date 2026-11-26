import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import NotFound from '../NotFound';
import ClubsSection from './detail/ClubsSection';
import GraduationsSection from './detail/GraduationsSection';
import PersonalDetailsSection from './detail/PersonalDetailsSection';
import ReferencesSection from './detail/ReferencesSection';
import { fullName } from './member';

/**
 * A Member's detail page (/members/:id). It loads the Member and lays out one section per
 * part of the record. Each section gets the Member and `onChange(updatedMember)`: every
 * member-service write on a Member resolves with the whole updated Member, so a section
 * that writes passes that result to onChange and the page re-renders all sections.
 */
export default function MemberPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: member, error, loading, setData: setMember } = useApiData((api) => api.members.get(id), [id]);

  if (loading) return <p role="status">{t('app.loading')}</p>;
  if (error?.kind === ERROR_KINDS.notFound) return <NotFound message={t('members.detail.notFound')} />;
  if (error) return <ApiErrorMessage error={error} />;

  return (
    <article>
      <h2>{fullName(member)}</h2>
      <PersonalDetailsSection member={member} onChange={setMember} />
      <ClubsSection member={member} onChange={setMember} />
      <GraduationsSection member={member} onChange={setMember} />
      <ReferencesSection member={member} onChange={setMember} />
    </article>
  );
}
