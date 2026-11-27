import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { useApiData } from '../api/useApiData';
import PersonalDetailsSection from '../members/detail/PersonalDetailsSection';
import Section from '../members/detail/Section';
import { fullName, sortClubs } from '../members/member';
import '../styles/MemberDetail.css';

/** /profile: the logged-in person's own Member record, their Profile. */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, error, loading } = useApiData((api) => api.profile.get(), []);

  if (loading)
    return (
      <p role="status" className="loading">
        {t('app.loading')}
      </p>
    );
  if (error) return <ApiErrorMessage error={error} />;

  const edit = (
    <button type="button" className="btn btn-edit">
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
