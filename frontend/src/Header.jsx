import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { NavLink } from 'react-router-dom';
import { useSession } from './auth/useSession';
import LanguageSwitcher from './i18n/LanguageSwitcher';

function Navigation() {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <nav>
      {session.isInstructor ? (
        <NavLink to="/" end>
          {t('header.members')}
        </NavLink>
      ) : (
        <NavLink to={`/members/${session.memberId}`}>{t('header.profile')}</NavLink>
      )}{' '}
      <NavLink to="/clubs">{t('header.clubs')}</NavLink>
    </nav>
  );
}

function SessionInfo() {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <div>
      <span>{session.name}</span> <span>{session.role && t(`roles.${session.role}`)}</span>{' '}
      <button type="button" onClick={session.logout}>
        {t('header.logout')}
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
          <Navigation />
          <SessionInfo />
        </>
      )}
      <LanguageSwitcher />
    </header>
  );
}
