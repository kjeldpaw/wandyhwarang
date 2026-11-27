import { http, HttpResponse } from 'msw';
import { config } from '../config';
import { people } from './keycloak';

/*
 * A stand-in for member-service: fixtures with member-service's shapes and seeded ids,
 * and default MSW handlers that apply its read access rules. Tests override handlers
 * with server.use(...); write endpoints have no default handler, so a test that writes
 * says what member-service answers.
 */

// Absolute member-service URL for a path, for MSW handlers: api('/clubs').
export const api = (path) => `${config.memberServiceUrl}${path}`;

// Clubs as seeded in member-service (fixed ids).
export const clubs = {
  randers: {
    id: '0d09a35b-02c4-4279-9416-a5a302613f3f',
    name: 'Randers Taekwondo Klub',
    address: { street: 'Mariagervej 180', city: 'Randers', zipCode: '8920' },
  },
  midtdjurs: {
    id: 'a4f3fcc3-904b-48c0-9b2b-4225dc6dbe92',
    name: 'Midtdjurs Taekwondo Klub',
    address: { street: 'Bugtrupvej 33', city: 'Kolind', zipCode: '8560' },
  },
  aarhus: {
    id: 'eced5ba8-4097-4284-b69b-4c8ef24838cc',
    name: 'Taekwondoklubben Hwa Rang Aarhus',
    address: { street: 'Læssøesgade 24', city: 'Aarhus', zipCode: '8000' },
  },
  nordjysk: {
    id: 'e52a3058-c086-4588-b7cf-4a30f14a10a1',
    name: 'Nordjysk Taekwondo Center',
    address: { street: 'Studievej 14', city: 'Nørresundby', zipCode: '9400' },
  },
};

const DAY = 24 * 60 * 60;

// Belts as seeded in member-service, keyed by Kup, Dan or Mon number: belts.mon9 … belts.mon1,
// belts.kup10 … belts.kup1, belts.dan1 … belts.dan3. Rank 1 is the lowest.
export const belts = Object.fromEntries(
  [
    [1, 'Yellow Belt (9. MON)', '2eeaf34f-cada-426b-94e8-917386df594b'],
    [2, 'Orange Belt (8. MON)', 'ead57272-3dc9-4480-aba1-fd490c89eac6'],
    [3, 'Green Belt (7. MON)', 'ae6111b5-377a-41e7-be00-7dfd79e62514'],
    [4, 'Blue Belt (6. MON)', 'b8f0900f-18b0-4972-8a4f-b92a29a2cca9'],
    [5, 'Blue Belt with red snippet (5. MON)', 'f2189897-a0ef-4739-847e-a1057ed583ab'],
    [6, 'Red Belt (4. MON)', '25debc67-39ea-49bb-9fc6-135f513eb86e'],
    [7, 'Red Belt with black snippet (3. MON)', '2857610a-c7e9-4ce3-9a6c-8505dc6e1b88'],
    [8, 'Red Belt with two black snippets (2. MON)', 'd7babcec-2e35-4767-b51e-188bfc885801'],
    [9, 'Red Belt with three black snippets (1. MON)', 'a10fb285-6fd7-46f5-a87f-6edfc8ccebf4'],
    [10, 'White Belt with yellow snippet (10. KUP)', '9ad942fa-c38b-4236-987e-3d6a1556aadf'],
    [11, 'Yellow Belt (9. KUP)', '92571ddc-01a0-490f-baed-d89c66c1e61d'],
    [12, 'Orange Belt (8. KUP)', 'bcd4a304-3ced-4919-8815-334ce85e0b30'],
    [13, 'Green Belt (7. KUP)', 'a08afafd-3c92-47d2-91b4-5c5406f7cc9d'],
    [14, 'Blue Belt (6. KUP)', 'f1a18af6-b1f7-4f9a-bb3e-2fd8fe1a85d5'],
    [15, 'Blue Belt with red snippet (5. KUP)', '4770146b-988a-4b12-b54f-3d63fe714280'],
    [16, 'Red Belt (4. KUP)', '2062c9ea-a85c-4dc8-aab1-ff003d226de8'],
    [17, 'Red Belt with black snippet (3. KUP)', '3ac08b1d-4ca6-4208-a3c9-a8ebd414cc9a'],
    [18, 'Red Belt with two black snippets (2. KUP)', '83e327ba-714a-4c67-80ad-b1f37dfaee6a'],
    [19, 'Red Belt with three black snippets (1. KUP)', '16f1e0cc-3421-4444-bfdd-a1206c7769b0'],
    [20, 'Black Belt (1. DAN)', 'aae0ca9f-4674-460b-9b63-4850bf018dcb', 365],
    [21, 'Black Belt (2. DAN)', '3f5c8106-a51c-4d24-bd99-a651758b5f9a', 730],
    [22, 'Black Belt (3. DAN)', '4a5a38a8-b293-45be-af5d-7653d8318d33', 1096],
  ].map(([rank, name, id, waitDays = 0]) => {
    const [, number, unit] = name.match(/\((\d+)\. (\w+)\)$/);
    return [`${unit.toLowerCase()}${number}`, { id, name, waitTime: waitDays * DAY, rank }];
  }),
);

// An Examiner as member-service shows one on a Graduation or in the Examiner search.
export const examinerOf = ({ id, firstName, lastName }) => ({ id, firstName, lastName });

// A Graduation history, latest first: graduations({ date, belt, graduatedBy }, …older).
// Ids are derived from the date and Belt, so tests can rebuild them.
export function graduations(...entries) {
  return entries.reduceRight(
    (previousGraduation, { date, belt, graduatedBy }) => ({
      id: `graduation-${date}-${belt.rank}`,
      date,
      graduatedBy: graduatedBy.map(examinerOf),
      belt,
      previousGraduation,
    }),
    null,
  );
}

const person = (id, firstName, lastName, rest) => ({
  id,
  firstName,
  lastName,
  address: { street: 'Vej 1', city: 'Randers', zipCode: '8920' },
  phone: null,
  email: `${firstName.toLowerCase()}@example.com`,
  dateOfBirth: null,
  clubs: [],
  graduation: null,
  references: [],
  ...rest,
});

// Members. ida, anne and mads are the people in test/keycloak.js (same ids = token sub).
//   ida   Instructor in Randers and Midtdjurs
//   anne  Admin, Member of Aarhus
//   mads  plain Member in Randers, with a full record (history, References)
//   kim   Midtdjurs, minimal record (no phone, birth date, Graduation or References)
//   ole   Nordjysk, an Examiner from a Club Ida isn't in
//   sofie Aarhus, not visible to Ida
const ole = person('33333333-3333-3333-3333-333333333333', 'Ole', 'Hansen', {
  address: { street: 'Studievej 2', city: 'Nørresundby', zipCode: '9400' },
  clubs: [clubs.nordjysk],
});
const ida = person(people.instructor.sub, 'Ida', 'Instruktør', {
  email: people.instructor.email,
  clubs: [clubs.randers, clubs.midtdjurs],
  graduation: graduations({ date: '2015-06-01', belt: belts.dan1, graduatedBy: [ole] }),
});
export const members = {
  ida,
  ole,
  anne: person(people.admin.sub, 'Anne', 'Admin', {
    email: people.admin.email,
    address: { street: 'Læssøesgade 1', city: 'Aarhus', zipCode: '8000' },
    clubs: [clubs.aarhus],
  }),
  mads: person(people.member.sub, 'Mads', 'Medlem', {
    email: people.member.email,
    address: { street: 'Storegade 12', city: 'Randers', zipCode: '8900' },
    phone: '12345678',
    dateOfBirth: '2010-04-01',
    clubs: [clubs.randers],
    graduation: graduations(
      { date: '2024-05-01', belt: belts.kup8, graduatedBy: [ida, ole] },
      { date: '2023-11-15', belt: belts.kup9, graduatedBy: [ida] },
      { date: '2023-05-01', belt: belts.kup10, graduatedBy: [ida] },
    ),
    references: [
      { id: 'reference-wwr', type: 'WandyWhaRang', reference: 'DK-1234' },
      { id: 'reference-kukkiwon', type: 'KukkiWon', reference: '05123456' },
    ],
  }),
  kim: person('44444444-4444-4444-4444-444444444444', 'Kim', 'Larsen', {
    address: { street: 'Bygaden 3', city: 'Kolind', zipCode: '8560' },
    clubs: [clubs.midtdjurs],
  }),
  sofie: person('55555555-5555-5555-5555-555555555555', 'Sofie', 'Berg', {
    address: { street: 'Nørregade 5', city: 'Aarhus', zipCode: '8000' },
    clubs: [clubs.aarhus],
    graduation: graduations({ date: '2022-09-10', belt: belts.kup5, graduatedBy: [ole] }),
  }),
};

// The caller of a request, read from the bearer token like member-service does.
function callerOf(request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)));
    const claims = JSON.parse(json);
    return { id: claims.sub, roles: claims.realm_access?.roles ?? [] };
  } catch {
    return null;
  }
}

// member-service's read rules (v1.1.0): an Admin sees everyone; an Instructor sees Members
// sharing a Club with their own record; a plain Member sees only themselves.
export function visibleTo(caller, member, all = Object.values(members)) {
  if (caller.roles.includes('admin')) return true;
  if (member.id === caller.id) return true;
  if (!caller.roles.includes('instructor')) return false;
  const own = all.find((m) => m.id === caller.id);
  return Boolean(own?.clubs.some((club) => member.clubs.some((c) => c.id === club.id)));
}

const unauthorised = () => new HttpResponse(null, { status: 401 });
const notFound = () => new HttpResponse(null, { status: 404 });

/**
 * Read handlers over a set of Members (default: all fixtures). A test can serve its own:
 *   server.use(...memberHandlers([members.mads, { ...members.kim, phone: '87654321' }]))
 */
export function memberHandlers(list = Object.values(members)) {
  return [
    http.get(api('/members'), ({ request }) => {
      const caller = callerOf(request);
      if (!caller) return unauthorised();
      return HttpResponse.json(list.filter((m) => visibleTo(caller, m, list)));
    }),
    http.get(api('/members/:id'), ({ request, params }) => {
      const caller = callerOf(request);
      if (!caller) return unauthorised();
      const member = list.find((m) => m.id === params.id);
      return member && visibleTo(caller, member, list) ? HttpResponse.json(member) : notFound();
    }),
    http.get(api('/examiners'), ({ request }) => {
      const caller = callerOf(request);
      if (!caller) return unauthorised();
      if (!caller.roles.some((role) => role === 'admin' || role === 'instructor')) {
        return new HttpResponse(null, { status: 403 });
      }
      const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
      if (q.length < 2) return HttpResponse.json({ message: 'Query q must be at least 2 characters' }, { status: 400 });
      return HttpResponse.json(
        list
          .filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q))
          .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
          .slice(0, 20)
          .map(examinerOf),
      );
    }),
  ];
}

// Default member-service: every request needs a bearer token.
export const memberServiceHandlers = [
  http.get(api('/clubs'), ({ request }) =>
    callerOf(request) ? HttpResponse.json(Object.values(clubs)) : unauthorised(),
  ),
  // member-service returns Belts unordered.
  http.get(api('/belts'), ({ request }) =>
    callerOf(request) ? HttpResponse.json(Object.values(belts).reverse()) : unauthorised(),
  ),
  ...memberHandlers(),
];
