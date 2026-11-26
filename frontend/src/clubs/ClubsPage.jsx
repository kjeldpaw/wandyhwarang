import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { useApiData } from '../api/useApiData';

export default function ClubsPage() {
  const { t } = useTranslation();
  const { data: clubs, error, loading } = useApiData((api) => api.clubs.list(), []);

  return (
    <section>
      <h2>{t('clubs.title')}</h2>
      {loading && <p role="status">{t('app.loading')}</p>}
      <ApiErrorMessage error={error} />
      {clubs && (
        <ul>
          {clubs.map((club) => (
            <li key={club.id}>
              <strong>{club.name}</strong>
              <br />
              {club.address.street}, {club.address.zipCode} {club.address.city}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
