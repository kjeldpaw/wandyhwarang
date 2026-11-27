# A logged-in person without a Member record creates their own Profile, in any Clubs

Someone can log in without a Member record, for example the first Admin made
in Keycloak or a login an Admin set up before anyone entered the person in the
register. Rather than leave them stuck until an Instructor or Admin enters
them, the app lets them create their own Member record, their Profile, through
member-service's `POST /api/v1/profile`. They choose any Clubs, not only Clubs
they already belong to, since they belong to none yet. The id and email come
from their token. Logins are still created only by Admins in Keycloak, so this
is not self-registration: only someone an Admin has let in can create a
Profile.

## Considered Options

- **Only Instructors and Admins create Member records**: the person waits for
  someone else to enter them, and an Instructor must re-type details the
  person knows best.
- **Let the person choose only Clubs an Instructor approves**: needs an
  approval flow and a pending state member-service doesn't have.

## Consequences

- Accepted risk: an `instructor` without a Member record can pick any Club,
  and so becomes an Instructor of it, as an Instructor is one in every Club
  they belong to. Logins with the `instructor` role are few and made by
  Admins.
- An Admin or Instructor may skip creating their Profile and work without
  one; a plain Member cannot.
- After creation, the person edits only their personal details on
  `/profile`; their Clubs, Graduations and References stay with Instructors
  and Admins.
