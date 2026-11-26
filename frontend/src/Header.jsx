import { useAuth } from 'react-oidc-context';
import { NavLink } from 'react-router-dom';
import { useSession } from './auth/useSession';

const roleLabels = { admin: 'Admin', instructor: 'Instruktør', member: 'Medlem' };

function SessionInfo() {
  const session = useSession();
  return (
    <div>
      <span>{session.name}</span> <span>{roleLabels[session.role]}</span>{' '}
      <button type="button" onClick={session.logout}>
        Log ud
      </button>
    </div>
  );
}

export default function Header() {
  const auth = useAuth();
  return (
    <header>
      <h1>Wandy Wha Rang</h1>
      {auth.isAuthenticated && (
        <>
          <nav>
            <NavLink to="/clubs">Klubber</NavLink>
          </nav>
          <SessionInfo />
        </>
      )}
    </header>
  );
}
