import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useApiData } from '../../api/useApiData';
import { useSession } from '../../auth/useSession';
import { sortClubs } from '../member';
import Section from './Section';

// Clubs the session may add to or remove from a Member: an Admin any Club, an Instructor
// the Clubs of their own Member record (member-service answers 403 for any other).
const manageableClubs = (api, session) =>
  session.isAdmin ? api.clubs.list() : api.members.get(session.memberId).then((own) => own.clubs);

/** The Clubs the Member belongs to, by name. Instructors and Admins add and remove Clubs here. */
export default function ClubsSection({ member, onChange }) {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <Section title={t('members.detail.clubs')}>
      {session.isInstructor ? (
        <ManageClubs member={member} onChange={onChange} session={session} />
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

function ManageClubs({ member, onChange, session }) {
  const { t } = useTranslation();
  const api = useApi();
  const { data: manageable = [] } = useApiData((api) => manageableClubs(api, session), [
    session.isAdmin,
    session.memberId,
  ]);
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
