import { screen, waitFor, within } from '@testing-library/react';
import { config } from '../config';
import { keycloak } from '../test/keycloak';
import { completeLogin, renderApp } from '../test/renderApp';

test('an anonymous visit is sent to the Keycloak login with PKCE', async () => {
  const { navigator } = renderApp('/clubs', { as: null });

  await waitFor(() => expect(navigator.urls).toHaveLength(1));
  const url = navigator.lastUrl;
  expect(`${url.origin}${url.pathname}`).toBe(keycloak.authorizationEndpoint);
  expect(url.searchParams.get('client_id')).toBe(config.oidcClientId);
  expect(url.searchParams.get('response_type')).toBe('code');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('redirect_uri')).toBe(`${window.location.origin}/`);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test.each([
  ['admin', 'Anne Admin', 'Admin'],
  ['instructor', 'Ida Instruktør', 'Instruktør'],
  ['member', 'Mads Medlem', 'Medlem'],
])('the header shows the %s’s name and role', async (as, name, role) => {
  renderApp('/', { as });

  const header = screen.getByRole('banner');
  expect(await within(header).findByText(name)).toBeInTheDocument();
  expect(within(header).getByText(role)).toBeInTheDocument();
});

test('after logging in at Keycloak the user lands on the route they asked for', async () => {
  const first = renderApp('/clubs?x=1', { as: null });
  await waitFor(() => expect(first.navigator.urls).toHaveLength(1));
  first.unmount();

  completeLogin(first.navigator, { as: 'admin' });

  expect(await screen.findByRole('heading', { name: 'Klubber' })).toBeInTheDocument();
  expect(within(screen.getByRole('banner')).getByText('Anne Admin')).toBeInTheDocument();
});

test('a reload keeps the user logged in, because the session lives in sessionStorage', async () => {
  const first = renderApp('/clubs', { as: null });
  await waitFor(() => expect(first.navigator.urls).toHaveLength(1));
  first.unmount();
  completeLogin(first.navigator, { as: 'member' }).unmount();
  await waitFor(() => expect(sessionStorage.length).toBeGreaterThan(0));
  window.history.replaceState(null, '', '/clubs');

  const reloaded = renderApp('/clubs', { as: null });

  expect(await screen.findByText('Mads Medlem')).toBeInTheDocument();
  expect(reloaded.navigator.urls).toEqual([]);
  expect(localStorage.length).toBe(0); // nothing that would outlive closing the browser
});

test('logging out ends the Keycloak session and returns to the app', async () => {
  const { user, navigator } = renderApp('/clubs', { as: 'instructor' });

  await user.click(await screen.findByRole('button', { name: 'Log ud' }));

  await waitFor(() => expect(navigator.urls).toHaveLength(1));
  const url = navigator.lastUrl;
  expect(`${url.origin}${url.pathname}`).toBe(keycloak.endSessionEndpoint);
  expect(url.searchParams.get('post_logout_redirect_uri')).toBe(`${window.location.origin}/`);
  expect(url.searchParams.get('id_token_hint')).toBeTruthy();
  expect(sessionStorage.length).toBe(0);
});
