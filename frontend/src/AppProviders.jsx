import { AuthProvider } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { ApiProvider } from './api/ApiProvider';
import I18nProvider from './i18n/I18nProvider';

/**
 * Everything App needs around it: language, OIDC session and the member-service client.
 * Must sit inside a router. main.jsx and test/renderApp.jsx both use it.
 */
export default function AppProviders({ userManager, children }) {
  const navigate = useNavigate();

  // Back from Keycloak: drop ?code&state and go to the route asked for before login.
  const onSigninCallback = (user) => {
    navigate(user?.state?.returnTo ?? '/', { replace: true });
  };

  return (
    <I18nProvider>
      <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
        <ApiProvider userManager={userManager}>{children}</ApiProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
