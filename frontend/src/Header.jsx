import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { NavLink } from 'react-router-dom';
import { useSession } from './auth/useSession';
import LanguageSwitcher from './i18n/LanguageSwitcher';

function Navigation() {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <nav className="app-nav">
      {session.isInstructor && (
        <>
          <NavLink to="/" end className="nav-link">
            {t('header.members')}
          </NavLink>{' '}
        </>
      )}
      <NavLink to="/profile" className="nav-link">
        {t('header.profile')}
      </NavLink>{' '}
      <NavLink to="/clubs" className="nav-link">
        {t('header.clubs')}
      </NavLink>
    </nav>
  );
}

function SessionInfo() {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <div className="header-user">
      <span className="user-name">{session.name}</span>{' '}
      {session.role && <span className="user-role">{t(`roles.${session.role}`)}</span>}{' '}
      <button type="button" className="logout-btn" onClick={session.logout}>
        {t('header.logout')}
      </button>
    </div>
  );
}

export default function Header() {
  const auth = useAuth();
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">Wandy Wha Rang</h1>
        {auth.isAuthenticated && <Navigation />}
        <div className="header-side">
          {auth.isAuthenticated && <SessionInfo />}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
