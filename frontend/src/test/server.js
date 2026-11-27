import { setupServer } from 'msw/node';
import { keycloakHandlers } from './keycloak';
import { memberServiceHandlers } from './memberService';

// One MSW server for all tests: Keycloak and member-service over HTTP.
// Override per test with server.use(http.get(api('/clubs'), ...)).
export const server = setupServer(...keycloakHandlers, ...memberServiceHandlers);
