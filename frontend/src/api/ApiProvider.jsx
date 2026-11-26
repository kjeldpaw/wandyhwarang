import { createContext, useContext, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { loginArgs } from '../auth/userManager';
import { config } from '../config';
import { createApiClient } from './client';

const ApiContext = createContext(null);

// Provides one member-service client wired to the OIDC session. Must sit inside a router
// and the I18nProvider (the login it triggers on a 401 passes the current language).
export function ApiProvider({ userManager, children }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: config.memberServiceUrl,
        getAccessToken: async () => (await userManager.getUser())?.access_token,
        renew: async () => (await userManager.signinSilent())?.access_token,
        login: () => userManager.signinRedirect(loginArgs(locationRef.current, i18n.resolvedLanguage)),
      }),
    [userManager, i18n],
  );
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

// The member-service client (see api/client.js).
export function useApi() {
  return useContext(ApiContext);
}
