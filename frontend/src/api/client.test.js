import { http, HttpResponse } from 'msw';
import { config } from '../config';
import { api, belts, clubs, examinerOf, members } from '../test/memberService';
import { server } from '../test/server';
import { createApiClient } from './client';

// The client's own interface: which HTTP request each method sends to member-service
// and what it resolves with. Screens are tested through the app (renderApp) instead.

const client = () =>
  createApiClient({
    baseUrl: config.memberServiceUrl,
    getAccessToken: async () => 'token-1',
    renew: async () => undefined,
    login: () => {},
  });

// Records the one request member-service receives and answers it with `response`.
function recordRequest(status = 200, response = members.mads) {
  const seen = {};
  server.use(
    http.all(api('/*'), async ({ request }) => {
      seen.method = request.method;
      seen.url = request.url;
      seen.authorization = request.headers.get('Authorization');
      const text = await request.text();
      seen.body = text ? JSON.parse(text) : undefined;
      return status === 204 ? new HttpResponse(null, { status }) : HttpResponse.json(response, { status });
    }),
  );
  return seen;
}

const id = members.mads.id;
const memberBody = {
  firstName: 'Mads',
  lastName: 'Medlem',
  address: { street: 'Storegade 12', city: 'Randers', zipCode: '8900' },
  email: 'mads@example.com',
};
// A Profile has no email: it is the login, taken from the token.
const { email: _, ...profileBody } = memberBody;
const graduation = { date: '2024-05-01', beltId: belts.kup8.id, examinerIds: [members.ole.id] };
// member-service calls the Examiners of a Graduation `graduatedBy`.
const graduationBody = { date: '2024-05-01', beltId: belts.kup8.id, graduatedBy: [members.ole.id] };

test.each([
  ['members.list', (c) => c.members.list(), 'GET', '/members', undefined],
  ['members.get', (c) => c.members.get(id), 'GET', `/members/${id}`, undefined],
  [
    'members.create',
    (c) => c.members.create({ ...memberBody, clubIds: [clubs.randers.id] }),
    'POST',
    '/members',
    { ...memberBody, clubIds: [clubs.randers.id] },
  ],
  ['members.update', (c) => c.members.update(id, memberBody), 'PUT', `/members/${id}`, memberBody],
  ['members.addClub', (c) => c.members.addClub(id, clubs.aarhus.id), 'PUT', `/members/${id}/clubs/${clubs.aarhus.id}`, undefined],
  [
    'members.removeClub',
    (c) => c.members.removeClub(id, clubs.randers.id),
    'DELETE',
    `/members/${id}/clubs/${clubs.randers.id}`,
    undefined,
  ],
  ['graduations.add', (c) => c.graduations.add(id, graduation), 'POST', `/members/${id}/graduation`, graduationBody],
  [
    'graduations.update',
    (c) => c.graduations.update(id, 'g-1', graduation),
    'PUT',
    `/members/${id}/graduation/g-1`,
    graduationBody,
  ],
  ['graduations.remove', (c) => c.graduations.remove(id, 'g-1'), 'DELETE', `/members/${id}/graduation/g-1`, undefined],
  [
    'references.add',
    (c) => c.references.add(id, { type: 'KukkiWon', reference: '05123456' }),
    'POST',
    `/members/${id}/reference`,
    { type: 'KukkiWon', reference: '05123456' },
  ],
  [
    'references.update',
    (c) => c.references.update(id, 'r-1', { reference: 'DK-5678' }),
    'PUT',
    `/members/${id}/reference/r-1`,
    { reference: 'DK-5678' },
  ],
  ['references.remove', (c) => c.references.remove(id, 'r-1'), 'DELETE', `/members/${id}/reference/r-1`, undefined],
  ['profile.get', (c) => c.profile.get(), 'GET', '/profile', undefined],
  ['profile.update', (c) => c.profile.update(profileBody), 'PUT', '/profile', profileBody],
  [
    'profile.create',
    (c) => c.profile.create({ ...profileBody, clubIds: [clubs.randers.id] }),
    'POST',
    '/profile',
    { ...profileBody, clubIds: [clubs.randers.id] },
  ],
  ['clubs.list', (c) => c.clubs.list(), 'GET', '/clubs', undefined],
  ['belts.list', (c) => c.belts.list(), 'GET', '/belts', undefined],
])('%s sends its request to member-service with the bearer token', async (_, call, method, path, body) => {
  const seen = recordRequest();

  await expect(call(client())).resolves.toEqual(members.mads);

  expect(seen).toEqual({ method, url: api(path), authorization: 'Bearer token-1', body });
});

test('members.remove deletes the Member and resolves with nothing', async () => {
  const seen = recordRequest(204);

  await expect(client().members.remove(id)).resolves.toBeUndefined();

  expect(seen).toMatchObject({ method: 'DELETE', url: api(`/members/${id}`) });
});

test('examiners.search finds Examiners in any Club by name, with the text URL-encoded', async () => {
  const seen = recordRequest(200, [examinerOf(members.ole)]);

  await expect(client().examiners.search('ole h&')).resolves.toEqual([examinerOf(members.ole)]);

  expect(seen).toMatchObject({ method: 'GET', url: api('/examiners?q=ole+h%26') });
});
