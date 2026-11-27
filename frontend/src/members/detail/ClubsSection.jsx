import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useWrite } from '../../api/useWrite';
import { useOwnClubs } from '../../auth/useOwnClubs';
import { useSession } from '../../auth/useSession';
import { sortClubs } from '../member';
import Section from './Section';

/**
 * The Clubs the Member belongs to, by name. Instructors and Admins add and remove Clubs here,
 * unless `readOnly` (on /profile).
 */
export default function ClubsSection({ member, onChange, readOnly = false }) {
  const { t } = useTranslation();
  const canEdit = useSession().isInstructor && !readOnly;
  return (
    <Section title={t('members.detail.clubs')}>
      {canEdit ? (
        <ManageClubs member={member} onChange={onChange} />
      ) : (
        <ul className="item-list">
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
  const { busy, error, run } = useWrite();

  const canManage = (club) => manageable.some((c) => c.id === club.id);
  const addable = sortClubs(manageable.filter((club) => !member.clubs.some((c) => c.id === club.id)));

  const write = (call) =>
    run(async () => {
      onChange(await call());
      setClubId('');
    });

  const add = (event) => {
    event.preventDefault();
    if (clubId) write(() => api.members.addClub(member.id, clubId));
  };

  return (
    <>
      <ul className="item-list">
        {sortClubs(member.clubs).map((club) => (
          <li key={club.id}>
            <span>{club.name}</span>{' '}
            {canManage(club) && (
              <button
                type="button"
                className="btn-danger btn-small"
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
        <form className="inline-form" onSubmit={add}>
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
          <button type="submit" className="btn-secondary" disabled={busy || !clubId}>
            {t('members.clubs.addButton')}
          </button>
        </form>
      )}
    </>
  );
}
