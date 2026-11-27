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
          <NavLink to="/eligible" className="nav-link">
            {t('header.eligible')}
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

// Shown instead of the Log out text on narrow screens; the text stays as the button's name.
function LogoutIcon() {
  return (
    <svg
      className="logout-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
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
        <LogoutIcon />
        <span className="logout-label">{t('header.logout')}</span>
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
