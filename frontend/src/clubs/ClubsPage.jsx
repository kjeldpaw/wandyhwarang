import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { useApiData } from '../api/useApiData';
import '../styles/Clubs.css';

export default function ClubsPage() {
  const { t } = useTranslation();
  const { data: clubs, error, loading } = useApiData((api) => api.clubs.list(), []);

  return (
    <section className="card">
      <h2>{t('clubs.title')}</h2>
      {loading && (
        <p role="status" className="loading">
          {t('app.loading')}
        </p>
      )}
      <ApiErrorMessage error={error} />
      {clubs && (
        <ul className="club-list">
          {clubs.map((club) => (
            <li key={club.id}>
              <strong className="club-name">{club.name}</strong>
              <br />
              {club.address.street}, {club.address.zipCode} {club.address.city}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
