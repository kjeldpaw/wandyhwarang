import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { NavLink } from 'react-router-dom';
import { useSession } from './auth/useSession';
import LanguageSwitcher from './i18n/LanguageSwitcher';

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
  const { t } = useTranslation();
  const auth = useAuth();
  return (
    <header>
      <h1>Wandy Wha Rang</h1>
      {auth.isAuthenticated && (
        <>
          <nav>
            <NavLink to="/clubs">{t('header.clubs')}</NavLink>
          </nav>
          <SessionInfo />
        </>
      )}
      <LanguageSwitcher />
    </header>
  );
}
