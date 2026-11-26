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
  conflict: 'conflict', // 409: duplicate email on create, removing a Member's last Club
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

  return {
    clubs: {
      /** All Clubs: Club[] {id, name, address{street, city, zipCode}} */
      list: () => request('GET', '/clubs'),
    },
  };
}
