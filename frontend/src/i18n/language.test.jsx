import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { keycloak } from '../test/keycloak';
import { api, clubs } from '../test/memberService';
import { server } from '../test/server';
import { setBrowserLanguages } from '../test/browser';
import { renderApp } from '../test/renderApp';

test.each([
  [['de-DE', 'de'], 'Vereine'],
  [['en-GB', 'en'], 'Clubs'],
  [['fr-FR', 'en-US'], 'Clubs'],
  [['fr-FR', 'sv'], 'Klubber'],
])('a first visit with browser languages %j shows the app in its language, else Danish', async (languages, clubs) => {
  setBrowserLanguages(languages);

  renderApp('/clubs', { as: 'instructor' });

  expect(await screen.findByRole('heading', { name: clubs })).toBeInTheDocument();
  expect(within(screen.getByRole('navigation')).getByRole('link', { name: clubs })).toBeInTheDocument();
});

test('switching language changes the UI at once and the next Keycloak login follows it', async () => {
  let clubsStatus = 200;
  server.use(
    http.get(api('/clubs'), () =>
      clubsStatus === 200 ? HttpResponse.json([clubs.randers]) : new HttpResponse(null, { status: clubsStatus }),
    ),
  );
  const { user, navigator } = renderApp('/', { as: 'instructor' });
  const header = screen.getByRole('banner');
  expect(await within(header).findByRole('button', { name: 'Log ud' })).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('da');

  await user.selectOptions(within(header).getByLabelText('Sprog'), 'English');

  expect(within(header).getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  expect(within(header).getByText('Instructor')).toBeInTheDocument();
  expect(within(header).getByLabelText('Language')).toHaveDisplayValue('English');
  expect(document.documentElement.lang).toBe('en');

  // The session has ended at Keycloak: the next member-service call sends the user to login.
  clubsStatus = 401;
  await user.click(within(header).getByRole('link', { name: 'Clubs' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired.');
  await waitFor(() => expect(navigator.urls).toHaveLength(1));
  expect(`${navigator.lastUrl.origin}${navigator.lastUrl.pathname}`).toBe(keycloak.authorizationEndpoint);
  expect(navigator.lastUrl.searchParams.get('ui_locales')).toBe('en');
});

test('the saved choice wins over the browser language on the next visit, and login follows it', async () => {
  const first = renderApp('/', { as: 'instructor' });
  await first.user.selectOptions(await screen.findByLabelText('Sprog'), 'Deutsch');
  first.unmount();
  sessionStorage.clear(); // the browser was closed: logged out, language kept

  const { navigator } = renderApp('/clubs', { as: null });

  expect(screen.getByRole('status')).toHaveTextContent('Anmeldung läuft…');
  expect(screen.getByLabelText('Sprache')).toHaveDisplayValue('Deutsch');
  expect(document.documentElement.lang).toBe('de');
  await waitFor(() => expect(navigator.urls).toHaveLength(1));
  expect(navigator.lastUrl.searchParams.get('ui_locales')).toBe('de');
});

test('a login in the default language asks Keycloak for Danish', async () => {
  const { navigator } = renderApp('/clubs', { as: null });

  await waitFor(() => expect(navigator.urls).toHaveLength(1));
  expect(navigator.lastUrl.searchParams.get('ui_locales')).toBe('da');
  expect(document.documentElement.lang).toBe('da');
});

test('API errors are shown in the current language, never as server text', async () => {
  setBrowserLanguages(['de-DE']);
  server.use(http.get(api('/clubs'), () => HttpResponse.json({ message: 'server text' }, { status: 403 })));

  renderApp('/clubs', { as: 'member' });

  expect(await screen.findByRole('alert')).toHaveTextContent('Du hast keinen Zugriff darauf.');
  expect(screen.queryByText(/server text/)).not.toBeInTheDocument();
});
