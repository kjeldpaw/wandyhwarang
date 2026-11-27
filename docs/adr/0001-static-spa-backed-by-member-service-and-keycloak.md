# Frontend is a static SPA on one.com; PHP backend and MySQL retired in favour of member-service and Keycloak

The app used to run its own PHP backend and MySQL database at one.com, with a
hand-rolled login (shared HS256 secret), self-registration and password reset,
and its own model of users, clubs and belts. The membership register of Wandy
Wha Rang now lives in member-service on the k3s homelab, behind the
`wandywharang` Keycloak realm. We rebuilt the frontend as a static single-page
app (React, built with Vite) served by one.com at https://wandywharang.dk. It
talks only to member-service and logs in only through Keycloak. The PHP
backend and MySQL database are retired, and we start from empty data.

## Considered Options

- **Keep the PHP backend and sync it with member-service**: Admins and
  Instructors would maintain the same Members in two places, and the two
  models disagree (one Club per person, a single name field, one examiner per
  Belt, Belts up to 9. Dan).
- **Keep the PHP backend as a proxy in front of member-service**: keeps a
  second server to secure and deploy at one.com for no gain, since
  member-service already handles CORS and Keycloak tokens.
- **Host the frontend on k3s next to member-service**: one platform, but the
  domain and DNS are at one.com, and static hosting there is simple and
  already paid for.

## Consequences

- No self-registration or in-app password reset: Admins and Instructors
  create Members, Keycloak emails them to set a password, and Keycloak's
  login page handles password reset. A logged-in person without a Member
  record creates their own; see
  [0002](0002-a-person-without-a-member-record-creates-their-own-profile.md).
- The app is down whenever the homelab is. Accepted for an internal admin
  tool.
- The old data in MySQL is not migrated. The old app and its database at
  one.com are removed after the new app is accepted.
