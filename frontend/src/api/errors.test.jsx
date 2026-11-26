import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { accessTokenFor, keycloak, people, tokenResponse } from '../test/keycloak';
import { api, clubs } from '../test/memberService';
import { completeLogin, renderApp } from '../test/renderApp';
import { server } from '../test/server';

// The UI shows its own text per error kind, never member-service's message.
test.each([
  [403, 'Du har ikke adgang til dette.'],
  [404, 'Det findes ikke, eller du har ikke adgang til det.'],
  [409, 'Det kan ikke lade sig gøre, fordi det strider mod eksisterende data.'],
  [400, 'Nogle af oplysningerne er ikke gyldige.'],
  [500, 'member-service fejlede. Prøv igen senere.'],
])('a %i from member-service is shown as a clear message', async (status, message) => {
  server.use(
    http.get(api('/clubs'), () => HttpResponse.json({ message: 'server text not for users' }, { status })),
  );

  renderApp('/clubs');

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByText(/server text/)).not.toBeInTheDocument();
});

test('an unreachable member-service is shown as a connection problem', async () => {
  server.use(http.get(api('/clubs'), () => HttpResponse.error()));

  renderApp('/clubs');

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Kan ikke få forbindelse til member-service. Prøv igen senere.',
  );
});

test('a 401 renews the session once with the refresh token and retries', async () => {
  const renewedToken = accessTokenFor(people.instructor, { renewed: true });
  let grant;
  server.use(
    http.post(keycloak.tokenEndpoint, async ({ request }) => {
      grant = new URLSearchParams(await request.text());
      return tokenResponse(people.instructor, { accessToken: renewedToken });
    }),
    http.get(api('/clubs'), ({ request }) =>
      request.headers.get('Authorization') === `Bearer ${renewedToken}`
        ? HttpResponse.json([clubs.midtdjurs])
        : new HttpResponse(null, { status: 401 }),
    ),
  );

  const { navigator } = renderApp('/clubs', { as: 'instructor' });

  expect(await screen.findByText('Midtdjurs Taekwondo Klub')).toBeInTheDocument();
  expect(grant.get('grant_type')).toBe('refresh_token');
  expect(grant.get('refresh_token')).toBe(`refresh-${people.instructor.sub}`);
  expect(navigator.urls).toEqual([]);
});

test('a 401 that survives the renew sends the user to the Keycloak login, back to the same page', async () => {
  let rejectTokens = true;
  server.use(
    http.get(api('/clubs'), () =>
      rejectTokens ? new HttpResponse(null, { status: 401 }) : HttpResponse.json([clubs.aarhus]),
    ),
  );

  const first = renderApp('/clubs', { as: 'instructor' });

  await waitFor(() => expect(first.navigator.urls).toHaveLength(1));
  expect(`${first.navigator.lastUrl.origin}${first.navigator.lastUrl.pathname}`).toBe(keycloak.authorizationEndpoint);
  expect(await screen.findByRole('alert')).toHaveTextContent('Din session er udløbet. Du sendes til login.');

  first.unmount();
  rejectTokens = false;
  completeLogin(first.navigator, { as: 'instructor' });
  expect(await screen.findByText('Taekwondoklubben Hwa Rang Aarhus')).toBeInTheDocument();
});
