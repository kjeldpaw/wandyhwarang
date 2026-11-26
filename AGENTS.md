# Wandy Wha Rang frontend

Single-page app where Admins and Instructors of Wandy Wha Rang manage
Members, their Clubs, Graduations and References. A plain Member sees only
their own profile.

## Architecture

- **Static SPA at one.com.** React 18 with react-router 6, built with Vite
  into static files and served by one.com's Apache at
  https://wandywharang.dk. There is no server-side code in this repo.
- **member-service is the only backend.** A Quarkus service on the k3s
  homelab (`https://member-service.k3s.figge.dk/api/v1`), repo
  `~/Workspace/Kubernetes/member-service` (github.com/kjeldpaw/member-service).
  It holds all data and enforces all access rules; the UI only hides actions
  a role can't perform.
- **Keycloak handles login.** Realm `wandywharang` at
  `https://keycloak.k3s.figge.dk`, public client `wandywharang-frontend`,
  Authorization Code with PKCE. Roles come from the access token's realm
  roles (`admin`, `instructor`, `member`). There is no self-registration or
  in-app password reset.
- Keycloak and member-service URLs and the client id are set at build time
  through Vite environment variables, not a runtime config file.

The PHP backend and MySQL database this repo used to hold are retired; see
[docs/adr/0001](docs/adr/0001-static-spa-backed-by-member-service-and-keycloak.md).

## Language

member-service's
[GLOSSARY.md](https://github.com/kjeldpaw/member-service/blob/main/GLOSSARY.md)
(`~/Workspace/Kubernetes/member-service/GLOSSARY.md`) is the source of terms.
This repo has no glossary of its own. Use its words (Member, Club, Belt,
Graduation, Examiner, Reference, Instructor, Admin) in code, tests and UI
text, and avoid the words it lists under _Avoid_ (such as User, Grade or
coach). The old app's "master" role is now Instructor.

The organisation is spelled **Wandy Wha Rang** (`wandywharang`). The repo
name `wandyhwarang` is a legacy spelling kept for now; don't copy it into
new code or UI text.

## Layout and commands

Everything runs from `frontend/`:

- `npm run dev`: Vite dev server on http://localhost:3000
- `npm test`: Vitest, runs once (use `npm run test:watch` to watch)
- `npm run build`: static build into `frontend/dist`

`frontend/src/main.jsx` mounts `App` inside a `BrowserRouter`;
`frontend/src/App.jsx` holds the routes. Tests live next to the code as
`*.test.jsx`; `frontend/src/test/setup.js` is the Vitest setup file.

## Testing

Tests check what a user sees and does, and which HTTP requests reach
member-service. Render the whole `App` at a route (inside a `MemoryRouter`)
with React Testing Library, and let MSW stand in for member-service. Don't
mock app modules or assert on component internals.

## Decisions

ADRs live in `docs/adr/`. Read the ones touching your area before changing
it, and add one for decisions that are hard to reverse and surprising
without context.

## Issues

Issues and specs live in this repo's GitHub Issues; use `gh`.
