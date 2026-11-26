import ApiErrorMessage from '../api/ApiErrorMessage';
import { useApiData } from '../api/useApiData';

export default function ClubsPage() {
  const { data: clubs, error, loading } = useApiData((api) => api.clubs.list(), []);

  return (
    <section>
      <h2>Klubber</h2>
      {loading && <p role="status">Henter…</p>}
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
