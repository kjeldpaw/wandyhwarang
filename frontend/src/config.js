// Build-time configuration, from Vite environment variables (see frontend/.env).
export const config = {
  oidcAuthority: import.meta.env.VITE_OIDC_AUTHORITY,
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  memberServiceUrl: import.meta.env.VITE_MEMBER_SERVICE_URL,
};
