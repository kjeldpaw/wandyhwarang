import { useEffect } from 'react';
import { hasAuthParams, useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router-dom';
import { loginArgs } from './userManager';

// Renders children only for a logged-in user; anyone else is sent to Keycloak.
export default function RequireLogin({ children }) {
  const auth = useAuth();
  const location = useLocation();
  const mustLogin = !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !hasAuthParams();

  useEffect(() => {
    if (mustLogin) auth.signinRedirect(loginArgs(location));
  }, [mustLogin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (auth.isAuthenticated) return children;
  return <p role="status">Logger ind…</p>;
}
