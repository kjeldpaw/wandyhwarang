import { http, HttpResponse } from 'msw';
import { config } from '../config';

const authority = config.oidcAuthority;
const oidc = `${authority}/protocol/openid-connect`;

export const keycloak = {
  authorizationEndpoint: `${oidc}/auth`,
  tokenEndpoint: `${oidc}/token`,
  endSessionEndpoint: `${oidc}/logout`,
};

// base64url of the UTF-8 JSON, as in a real JWT.
const base64url = (value) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

// An unsigned JWT; the app never verifies signatures, it only reads claims.
export const fakeJwt = (claims) => `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(claims)}.x`;

// People to log in as. `roles` are realm roles as Keycloak puts them in the access token.
export const people = {
  admin: {
    sub: '00000000-0000-0000-0000-00000000a0a0',
    given_name: 'Anne',
    family_name: 'Admin',
    email: 'anne@example.com',
    roles: ['default-roles-wandywharang', 'member', 'admin'],
  },
  instructor: {
    sub: '11111111-1111-1111-1111-111111111111',
    given_name: 'Ida',
    family_name: 'Instruktør',
    email: 'ida@example.com',
    roles: ['default-roles-wandywharang', 'member', 'instructor'],
  },
  member: {
    sub: '22222222-2222-2222-2222-222222222222',
    given_name: 'Mads',
    family_name: 'Medlem',
    email: 'mads@example.com',
    roles: ['default-roles-wandywharang', 'member'],
  },
};

export function profileOf(person) {
  return {
    sub: person.sub,
    name: `${person.given_name} ${person.family_name}`,
    given_name: person.given_name,
    family_name: person.family_name,
    preferred_username: person.email,
    email: person.email,
  };
}

export function accessTokenFor(person, extraClaims = {}) {
  return fakeJwt({
    ...profileOf(person),
    exp: Math.floor(Date.now() / 1000) + 3600,
    realm_access: { roles: person.roles },
    ...extraClaims,
  });
}

export const idTokenFor = (person) =>
  fakeJwt({ ...profileOf(person), iss: authority, aud: config.oidcClientId, exp: Math.floor(Date.now() / 1000) + 3600 });

// Puts a logged-in person into sessionStorage exactly as oidc-client-ts stores it.
export function seedSession(person, { accessToken = accessTokenFor(person) } = {}) {
  const key = `oidc.user:${authority}:${config.oidcClientId}`;
  sessionStorage.setItem(
    key,
    JSON.stringify({
      id_token: idTokenFor(person),
      session_state: null,
      access_token: accessToken,
      refresh_token: `refresh-${person.sub}`,
      token_type: 'Bearer',
      scope: 'openid profile email',
      profile: profileOf(person),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return accessToken;
}

// A token endpoint that answers both the authorization_code and refresh_token grants
// for `person`. Tests override it with server.use(tokenHandler(...)) or an error.
export function tokenHandler(person, options) {
  return http.post(keycloak.tokenEndpoint, () => tokenResponse(person, options));
}

// A Keycloak token response for `person`, for custom token-endpoint handlers.
export function tokenResponse(person, { accessToken = accessTokenFor(person, { renewed: true }) } = {}) {
  return HttpResponse.json({
    access_token: accessToken,
    id_token: idTokenFor(person),
    refresh_token: `refresh-${person.sub}-2`,
    token_type: 'Bearer',
    expires_in: 300,
    scope: 'openid profile email',
  });
}

export const keycloakHandlers = [
  http.get(`${authority}/.well-known/openid-configuration`, () =>
    HttpResponse.json({
      issuer: authority,
      authorization_endpoint: keycloak.authorizationEndpoint,
      token_endpoint: keycloak.tokenEndpoint,
      end_session_endpoint: keycloak.endSessionEndpoint,
      userinfo_endpoint: `${oidc}/userinfo`,
      jwks_uri: `${oidc}/certs`,
    }),
  ),
  // No default token handler: a test that expects a renew or login says who gets the tokens.
  http.post(keycloak.tokenEndpoint, () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })),
];
