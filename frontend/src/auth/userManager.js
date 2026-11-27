import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { config } from '../config';

/**
 * The oidc-client-ts UserManager for the `wandywharang-frontend` Keycloak client:
 * Authorization Code + PKCE, user kept in sessionStorage (survives reload, not
 * browser close), silent renew with the refresh token.
 * `navigator` replaces the browser redirect; only tests pass one.
 */
export function createUserManager({ navigator } = {}) {
  const appUrl = `${window.location.origin}/`;
  return new UserManager(
    {
      authority: config.oidcAuthority,
      client_id: config.oidcClientId,
      redirect_uri: appUrl,
      post_logout_redirect_uri: appUrl,
      response_type: 'code',
      scope: 'openid profile email',
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      automaticSilentRenew: true,
    },
    navigator,
  );
}

// signinRedirect arguments: come back to the route the visitor asked for, and show
// Keycloak's login pages in the app's current language.
export const loginArgs = (location, language) => ({
  state: { returnTo: `${location.pathname}${location.search}${location.hash}` },
  ui_locales: language,
});
