import { http, HttpResponse } from 'msw';
import { config } from '../config';

// Absolute member-service URL for a path, for MSW handlers: api('/clubs').
export const api = (path) => `${config.memberServiceUrl}${path}`;

// Fixtures follow member-service's seeded data (fixed ids).
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
};

// Default member-service: every request needs a bearer token.
export const memberServiceHandlers = [
  http.get(api('/clubs'), ({ request }) =>
    request.headers.get('Authorization')?.startsWith('Bearer ')
      ? HttpResponse.json(Object.values(clubs))
      : new HttpResponse(null, { status: 401 }),
  ),
];
