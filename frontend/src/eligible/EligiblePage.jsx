import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { ERROR_KINDS } from '../api/client';
import { useApiData } from '../api/useApiData';
import { useOwnClubs } from '../auth/useOwnClubs';
import { useSession } from '../auth/useSession';
import BeltName from '../belts/BeltName';
import { useFormatDate } from '../i18n/formatDate';
import { byName, fullName, sortClubs } from '../members/member';
import '../styles/Eligible.css';
import '../styles/MemberList.css';

/**
 * /eligible, "Berettiget": an Instructor or Admin picks the date of the next black-belt
 * Graduation and sees the Members of every Club who are Eligible for a Dan or Poom on it.
 * member-service decides who is Eligible and for which Belt; the date is never saved.
 */
export default function EligiblePage() {
  const { isInstructor } = useSession();
  if (!isInstructor) return <ApiErrorMessage error={{ kind: ERROR_KINDS.forbidden }} />;
  return <Eligible />;
}

// The name of the Club a Member is listed under when no Club is filtered: the first of theirs by name.
const firstClubName = (member) => sortClubs(member.clubs)[0]?.name ?? '';

function Eligible() {
  const { t } = useTranslation();
  const dateId = useId();
  const [date, setDate] = useState('');
  const [clubId, setClubId] = useState('');
  const list = useApiData((api) => (date ? api.eligible.list(date) : Promise.resolve(undefined)), [date]);
  const canOpen = useCanOpen();

  // Another date's list may lack the filtered Club, so a new date starts with all Clubs.
  const pickDate = (value) => {
    setDate(value);
    setClubId('');
  };

  const members = date ? list.data : undefined;
  const clubs = members && sortClubs(uniqueClubs(members));
  const shown = members
    ?.filter((member) => !clubId || member.clubs.some((club) => club.id === clubId))
    .sort((a, b) => (clubId ? 0 : firstClubName(a).localeCompare(firstClubName(b), 'da')) || byName(a, b));

  return (
    <section className="card eligible-list">
      <div className="card-header">
        <h2 id="eligible-title">{t('eligible.title')}</h2>
      </div>
      <p>{t('eligible.intro')}</p>
      <div className="filters">
        <label htmlFor={dateId}>
          {t('eligible.date')}
          <input id={dateId} type="date" value={date} onChange={(event) => pickDate(event.target.value)} />
        </label>
        {clubs && (
          <label>
            {t('eligible.club')}{' '}
            <select value={clubId} onChange={(event) => setClubId(event.target.value)}>
              <option value="">{t('eligible.allClubs')}</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {date && list.loading && (
        <p role="status" className="loading">
          {t('app.loading')}
        </p>
      )}
      {date && <ApiErrorMessage error={list.error} />}
      {shown && shown.length === 0 && <p className="empty">{t('eligible.none')}</p>}
      {shown && shown.length > 0 && (
        <EligibleTable members={shown} date={date} canOpen={canOpen} />
      )}
    </section>
  );
}

function EligibleTable({ members, date, canOpen }) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  return (
    <table aria-labelledby="eligible-title" className="data-table">
      <thead>
        <tr>
          <th scope="col">{t('eligible.name')}</th>
          <th scope="col">{t('eligible.clubs')}</th>
          <th scope="col">{t('eligible.belt')}</th>
          <th scope="col">{t('eligible.graduated')}</th>
          <th scope="col">{t('eligible.nextBelt')}</th>
          <th scope="col">{t('eligible.eligibleSince')}</th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.id}>
            <td>{canOpen(member) ? <Link to={`/members/${member.id}`}>{fullName(member)}</Link> : fullName(member)}</td>
            <td>{sortClubs(member.clubs).map((club) => club.name).join(', ')}</td>
            <td>
              <BeltName belt={member.belt} />
            </td>
            <td>{formatDate(member.graduationDate)}</td>
            <td>
              <BeltName belt={member.nextBelt} />
            </td>
            <td>
              {/* ISO dates compare as text. Later than the date: Eligible only through the month allowed. */}
              {member.eligibleSince > date ? (
                <strong className="eligible-later">
                  {t('eligible.eligibleFrom', { date: formatDate(member.eligibleSince) })}
                </strong>
              ) : (
                <span>{formatDate(member.eligibleSince)}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function uniqueClubs(members) {
  const byId = new Map(members.flatMap((member) => member.clubs.map((club) => [club.id, club])));
  return [...byId.values()];
}

/**
 * canOpen(member): whether the caller can open a listed Member's page. An Admin can open any
 * Member, an Instructor only a Member sharing a Club with their own record (member-service
 * answers 404 to the others). An Instructor whose record can't be read opens no one.
 */
function useCanOpen() {
  const { isAdmin } = useSession();
  const ownClubs = useOwnClubs();
  const ownIds = new Set((ownClubs.data ?? []).map((club) => club.id));
  return (member) => isAdmin || member.clubs.some((club) => ownIds.has(club.id));
}
