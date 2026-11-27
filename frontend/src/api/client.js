/**
 * The member-service client: one deep module for every call the app makes.
 * Create it with createApiClient (ApiProvider does; components get it with useApi()).
 *
 * Every method resolves with the parsed JSON body (undefined for 204) or rejects
 * with an ApiError whose `kind` is one of ERROR_KINDS. The UI shows text per kind
 * and never member-service's message text.
 */

export const ERROR_KINDS = {
  network: 'network', // member-service unreachable (fetch failed)
  unauthorised: 'unauthorised', // 401 even after one renew; the user is being sent to login
  forbidden: 'forbidden', // 403: role or access rule
  notFound: 'notFound', // 404: missing, or not visible to this user
  conflict: 'conflict', // 409: duplicate email on create, a second Profile, removing a Member's last Club
  validation: 'validation', // 400: invalid request body
  server: 'server', // 5xx or anything else unexpected
};

export class ApiError extends Error {
  constructor(kind, { status, body } = {}) {
    super(`member-service request failed: ${kind}${status ? ` (${status})` : ''}`);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.body = body; // parsed JSON error body if any; for diagnostics, not for display
  }
}

const kindByStatus = {
  400: ERROR_KINDS.validation,
  401: ERROR_KINDS.unauthorised,
  403: ERROR_KINDS.forbidden,
  404: ERROR_KINDS.notFound,
  409: ERROR_KINDS.conflict,
};

async function parseBody(response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// The app says examinerIds; member-service's request field is graduatedBy.
const graduationBody = ({ date, beltId, examinerIds }) => ({ date, beltId, graduatedBy: examinerIds });

/**
 * baseUrl         member-service base URL, e.g. https://member-service.k3s.figge.dk/api/v1
 * getAccessToken  () => Promise<string|undefined>  current access token
 * renew           () => Promise<string|undefined>  renews the session, resolves the new token
 * login           () => void                        sends the browser to the Keycloak login
 */
export function createApiClient({ baseUrl, getAccessToken, renew, login }) {
  // Concurrent 401s share one renew, and the browser is sent to login at most once.
  let renewing = null;
  let loggingIn = false;

  function renewOnce() {
    renewing ??= renew()
      .catch(() => undefined)
      .finally(() => {
        renewing = null;
      });
    return renewing;
  }

  function loginOnce() {
    if (loggingIn) return;
    loggingIn = true;
    login();
  }

  async function send(method, path, body, token) {
    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    try {
      return await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(ERROR_KINDS.network);
    }
  }

  async function request(method, path, body) {
    let response = await send(method, path, body, await getAccessToken());
    if (response.status === 401) {
      // The token may have expired under us: renew once and retry.
      const renewed = await renewOnce();
      if (renewed) response = await send(method, path, body, renewed);
      if (response.status === 401) {
        loginOnce();
        throw new ApiError(ERROR_KINDS.unauthorised, { status: 401 });
      }
    }
    const parsed = await parseBody(response);
    if (response.ok) return parsed;
    throw new ApiError(kindByStatus[response.status] ?? ERROR_KINDS.server, {
      status: response.status,
      body: parsed,
    });
  }

  const member = (id) => `/members/${encodeURIComponent(id)}`;

  // Shapes are member-service's (see its api/*.java). Every write on a Member's Clubs,
  // Graduations or References resolves with the whole updated Member.
  return {
    members: {
      /** Members the caller may see (Admin: all; Instructor: sharing a Club; Member: self): Member[] */
      list: () => request('GET', '/members'),
      /** One Member: {id, firstName, lastName, address, phone, email, dateOfBirth, clubs, graduation, references} */
      get: (id) => request('GET', member(id)),
      /** {firstName, lastName, address{street, city, zipCode}, phone?, email, dateOfBirth?, clubIds[]} -> Member (409: email exists) */
      create: (body) => request('POST', '/members', body),
      /** Same as create without clubIds; email is required but can't change -> Member */
      update: (id, body) => request('PUT', member(id), body),
      /** Admin only; resolves with nothing */
      remove: (id) => request('DELETE', member(id)),
      /** -> Member */
      addClub: (id, clubId) => request('PUT', `${member(id)}/clubs/${encodeURIComponent(clubId)}`),
      /** -> Member (409: it is the Member's last Club) */
      removeClub: (id, clubId) => request('DELETE', `${member(id)}/clubs/${encodeURIComponent(clubId)}`),
    },
    graduations: {
      /** {date, beltId, examinerIds} -> Member (the new one becomes member.graduation) */
      add: (memberId, graduation) => request('POST', `${member(memberId)}/graduation`, graduationBody(graduation)),
      /** Same argument; replaces date, Belt and Examiners -> Member */
      update: (memberId, graduationId, graduation) =>
        request(
          'PUT',
          `${member(memberId)}/graduation/${encodeURIComponent(graduationId)}`,
          graduationBody(graduation),
        ),
      /** -> Member */
      remove: (memberId, graduationId) =>
        request('DELETE', `${member(memberId)}/graduation/${encodeURIComponent(graduationId)}`),
    },
    references: {
      /** {type: 'WandyWhaRang' | 'KukkiWon', reference} -> Member */
      add: (memberId, body) => request('POST', `${member(memberId)}/reference`, body),
      /** {reference} (the type can't change) -> Member */
      update: (memberId, referenceId, body) =>
        request('PUT', `${member(memberId)}/reference/${encodeURIComponent(referenceId)}`, body),
      /** -> Member */
      remove: (memberId, referenceId) =>
        request('DELETE', `${member(memberId)}/reference/${encodeURIComponent(referenceId)}`),
    },
    profile: {
      /** The caller's own Member record, their Profile: Member (404: they have none yet) */
      get: () => request('GET', '/profile'),
      /** {firstName, lastName, address{street, city, zipCode}, phone?, dateOfBirth?}; no email, no Clubs -> Member */
      update: (body) => request('PUT', '/profile', body),
      /**
       * Same plus clubIds[] (at least one, any Club) -> Member. The id and email come from the token.
       * 409: the caller already has a Member record, or another Member has their email.
       */
      create: (body) => request('POST', '/profile', body),
    },
    clubs: {
      /** All Clubs: Club[] {id, name, address{street, city, zipCode}} */
      list: () => request('GET', '/clubs'),
    },
    belts: {
      /** All Belts, unordered: Belt[] {id, name, waitTime, rank}; show them with belts/belt.js */
      list: () => request('GET', '/belts'),
    },
    eligible: {
      /**
       * Instructor/Admin: Members of any Club Eligible for a Dan or Poom on the ISO `date`, with
       * limited fields: {id, firstName, lastName, clubs, belt, graduationDate, nextBelt, eligibleSince}[]
       */
      list: (date) => request('GET', `/eligible?${new URLSearchParams({ date })}`),
    },
    examiners: {
      /** Instructor/Admin: Members of any Club matching `text` (>= 2 chars, max 20): {id, firstName, lastName}[] */
      search: (text) => request('GET', `/examiners?${new URLSearchParams({ q: text })}`),
    },
  };
}
