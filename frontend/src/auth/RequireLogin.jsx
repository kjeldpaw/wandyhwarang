import { useEffect } from 'react';
import { hasAuthParams, useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { loginArgs } from './userManager';

// Renders children only for a logged-in user; anyone else is sent to Keycloak.
export default function RequireLogin({ children }) {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const location = useLocation();
  // On the sign-in callback's ?code&state URL, which the router's location shows like the browser's.
  const inCallback = hasAuthParams(location);
  const mustLogin = !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !inCallback;

  useEffect(() => {
    if (mustLogin) auth.signinRedirect(loginArgs(location, i18n.resolvedLanguage));
  }, [mustLogin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wait until the sign-in callback has left the ?code&state URL: a route rendered there (such as
  // the start page's redirect to /profile) would be overtaken by the callback's own navigation.
  if (auth.isAuthenticated && !inCallback) return children;
  return <p role="status">{t('app.loggingIn')}</p>;
}
