import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useOwnClubs } from '../../auth/useOwnClubs';
import { useSession } from '../../auth/useSession';
import { sortClubs } from '../member';
import Section from './Section';

/** The Clubs the Member belongs to, by name. Instructors and Admins add and remove Clubs here. */
export default function ClubsSection({ member, onChange }) {
  const { t } = useTranslation();
  const { isInstructor } = useSession();
  return (
    <Section title={t('members.detail.clubs')}>
      {isInstructor ? (
        <ManageClubs member={member} onChange={onChange} />
      ) : (
        <ul>
          {sortClubs(member.clubs).map((club) => (
            <li key={club.id}>
              <span>{club.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ManageClubs({ member, onChange }) {
  const { t } = useTranslation();
  const api = useApi();
  // The session may add or remove only the Clubs it works with.
  const { data: manageable = [] } = useOwnClubs();
  const [clubId, setClubId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState();

  const canManage = (club) => manageable.some((c) => c.id === club.id);
  const addable = sortClubs(manageable.filter((club) => !member.clubs.some((c) => c.id === club.id)));

  async function write(call) {
    setBusy(true);
    setError(undefined);
    try {
      onChange(await call());
      setClubId('');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const add = (event) => {
    event.preventDefault();
    if (clubId) write(() => api.members.addClub(member.id, clubId));
  };

  return (
    <>
      <ul>
        {sortClubs(member.clubs).map((club) => (
          <li key={club.id}>
            <span>{club.name}</span>{' '}
            {canManage(club) && (
              <button
                type="button"
                disabled={busy}
                aria-label={t('members.clubs.removeClub', { club: club.name })}
                onClick={() => write(() => api.members.removeClub(member.id, club.id))}
              >
                {t('members.clubs.remove')}
              </button>
            )}
          </li>
        ))}
      </ul>
      <ApiErrorMessage error={error} messages={{ conflict: t('members.clubs.lastClub') }} />
      {addable.length > 0 && (
        <form onSubmit={add}>
          <label>
            {t('members.clubs.add')}{' '}
            <select value={clubId} onChange={(event) => setClubId(event.target.value)}>
              <option value="">{t('members.clubs.choose')}</option>
              {addable.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>{' '}
          <button type="submit" disabled={busy || !clubId}>
            {t('members.clubs.addButton')}
          </button>
        </form>
      )}
    </>
  );
}
