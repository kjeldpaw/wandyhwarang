import { useAuth } from 'react-oidc-context';

// Realm roles the app knows, most powerful first.
const ROLES = ['admin', 'instructor', 'member'];

// Reads the realm roles from a Keycloak access token (realm_access.roles).
// The token is not verified here: roles only show or hide UI, member-service decides.
export function rolesOf(accessToken) {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)));
    const realmRoles = JSON.parse(json).realm_access?.roles ?? [];
    return ROLES.filter((role) => realmRoles.includes(role));
  } catch {
    return [];
  }
}

/**
 * The logged-in person, for the UI. Only valid inside RequireLogin.
 *   name        display name from the ID token
 *   memberId    token `sub` = the person's Member id in member-service
 *   roles       ['admin' | 'instructor' | 'member'] they hold
 *   role        the most powerful of those ('admin' > 'instructor' > 'member')
 *   isAdmin, isInstructor (true for an Admin too), logout()
 */
export function useSession() {
  const auth = useAuth();
  const profile = auth.user?.profile ?? {};
  const roles = rolesOf(auth.user?.access_token ?? '');
  const role = roles[0] ?? null;
  return {
    name: profile.name ?? profile.preferred_username ?? '',
    memberId: profile.sub,
    roles,
    role,
    isAdmin: roles.includes('admin'),
    isInstructor: roles.includes('admin') || roles.includes('instructor'),
    logout: () => auth.signoutRedirect(),
  };
}
