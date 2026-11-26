import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import AppProviders from '../AppProviders';
import { createUserManager } from '../auth/userManager';
import { people, seedSession, tokenHandler } from './keycloak';
import { server } from './server';

// Stands in for the browser's full-page navigation (window.location.assign), which
// jsdom can't do. Records every URL oidc-client-ts sends the browser to.
export class RecordingNavigator {
  urls = [];

  async prepare() {
    return {
      navigate: async ({ url }) => {
        this.urls.push(url);
        return new Promise(() => {}); // a real redirect never comes back
      },
      close: () => {},
    };
  }

  async callback() {}

  get lastUrl() {
    const url = this.urls.at(-1);
    return url && new URL(url);
  }
}

/**
 * Renders the whole app at `path`, wrapped like main.jsx (StrictMode, providers) but
 * with a MemoryRouter and a RecordingNavigator.
 * `as`: 'admin' | 'instructor' | 'member' | a person object (see test/keycloak.js) | null for anonymous.
 * Returns RTL's result plus `user` (userEvent), `navigator` (browser redirects),
 * `person` and the seeded `accessToken`.
 */
export function renderApp(path = '/', { as = 'instructor' } = {}) {
  const person = typeof as === 'string' ? people[as] : as;
  const accessToken = person ? seedSession(person) : undefined;
  const navigator = new RecordingNavigator();
  const userManager = createUserManager({ navigator });
  const user = userEvent.setup();
  const result = render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <AppProviders userManager={userManager}>
          <App />
        </AppProviders>
      </MemoryRouter>
    </StrictMode>,
  );
  return { ...result, user, navigator, person, accessToken };
}

/**
 * Finishes a login that `navigator` sent to Keycloak: Keycloak "redirects back" to the app
 * with a code and the state, and its token endpoint issues tokens for `as`.
 * Unmount the first render before calling. Returns renderApp's result.
 */
export function completeLogin(navigator, { as = 'instructor' } = {}) {
  const person = typeof as === 'string' ? people[as] : as;
  const state = navigator.lastUrl.searchParams.get('state');
  const callback = `/?code=test-code&state=${state}`;
  window.history.replaceState(null, '', callback); // oidc-client-ts reads the callback from window.location
  server.use(tokenHandler(person));
  return renderApp(callback, { as: null });
}
