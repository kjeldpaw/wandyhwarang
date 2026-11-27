import { useTranslation } from 'react-i18next';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { useApiData } from '../api/useApiData';
import { useOwnClubs } from '../auth/useOwnClubs';
import { useSession } from '../auth/useSession';
import BeltName from '../belts/BeltName';
import '../styles/MemberList.css';
import { byName, currentBelt, fullName, sortClubs } from './member';

function matches(member, { clubId, search }) {
  if (clubId && !member.clubs.some((club) => club.id === clubId)) return false;
  const text = search.trim().toLowerCase();
  return !text || fullName(member).toLowerCase().includes(text);
}

/** The start page: Instructors and Admins get the Member list, a plain Member their Profile. */
export default function MemberListPage() {
  const session = useSession();
  if (!session.isInstructor) return <Navigate to="/profile" replace />;
  return <MemberList />;
}

function MemberList() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const filter = { clubId: params.get('club') ?? '', search: params.get('q') ?? '' };
  const list = useApiData((api) => api.members.list(), []);
  const ownClubs = useOwnClubs();
  const loading = list.loading || ownClubs.loading;
  const error = list.error ?? ownClubs.error;
  const members = list.data;
  const clubs = ownClubs.data;

  const setFilter = (name, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );

  const shown = members?.filter((member) => matches(member, filter)).sort(byName);

  return (
    <section className="card member-list">
      <div className="card-header">
        <h2 id="members-title">{t('members.list.title')}</h2>
        <p>
          <Link to="/members/new" className="btn btn-primary">
            {t('members.form.newTitle')}
          </Link>
        </p>
      </div>
      <div className="filters">
        <label>
          {t('members.list.club')}{' '}
          <select value={filter.clubId} onChange={(event) => setFilter('club', event.target.value)}>
            <option value="">{t('members.list.allClubs')}</option>
            {clubs &&
              sortClubs(clubs).map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
          </select>
        </label>{' '}
        <label>
          {t('members.list.search')}{' '}
          <input type="search" value={filter.search} onChange={(event) => setFilter('q', event.target.value)} />
        </label>
      </div>
      {loading && (
        <p role="status" className="loading">
          {t('app.loading')}
        </p>
      )}
      <ApiErrorMessage error={error} />
      {shown && shown.length === 0 && <p className="empty">{t('members.list.none')}</p>}
      {shown && shown.length > 0 && (
        <table aria-labelledby="members-title" className="data-table">
          <thead>
            <tr>
              <th scope="col">{t('members.list.name')}</th>
              <th scope="col">{t('members.list.clubs')}</th>
              <th scope="col">{t('members.list.belt')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((member) => (
              <tr key={member.id}>
                <td>
                  <Link to={`/members/${member.id}`}>{fullName(member)}</Link>
                </td>
                <td>{sortClubs(member.clubs).map((club) => club.name).join(', ')}</td>
                <td>
                  {currentBelt(member) ? (
                    <BeltName belt={currentBelt(member)} />
                  ) : (
                    t('members.list.noBelt')
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
