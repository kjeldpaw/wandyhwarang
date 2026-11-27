# Wandy Wha Rang frontend

Single-page app where Admins and Instructors of Wandy Wha Rang manage
Members, their Clubs, Graduations and References. Everyone views and edits
their own Profile (their Member record), and someone who logs in without a
Member record creates it. A plain Member sees nothing else.

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
  `frontend/.env` holds the production values; override them in
  `frontend/.env.local` (gitignored) or the build environment. Read them only
  through `frontend/src/config.js`:
  - `VITE_OIDC_AUTHORITY`: Keycloak realm URL,
    `https://keycloak.k3s.figge.dk/realms/wandywharang`
  - `VITE_OIDC_CLIENT_ID`: `wandywharang-frontend`
  - `VITE_MEMBER_SERVICE_URL`: `https://member-service.k3s.figge.dk/api/v1`

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

## UI languages

The app speaks Danish (default), English and German with `react-i18next`.
Every UI text is a key in `frontend/src/i18n/locales/{da,en,de}.json`
(read it with `const { t } = useTranslation()`); add each new key to all
three files, which a test checks. Show dates with `useFormatDate()` from
`frontend/src/i18n/formatDate.js`, and API errors with `<ApiErrorMessage>`,
never member-service's text. Taekwondo terms (Kup, Poom, Dan, Kukkiwon) and
Belt names are not translated. Translations of the glossary words: Member =
Medlem / Mitglied, Club = Klub / Verein, Belt = Bælte / Gürtel, Graduation =
Graduering / Graduierung, Examiner = Eksaminator / Prüfer, Reference =
Reference / Referenz, Instructor = Instruktør / Instruktor, Admin = Admin,
Eligible = Berettiget / Berechtigt.

## Layout and commands

Everything runs from `frontend/`:

- `npm run dev`: Vite dev server on http://localhost:3000
- `npm test`: Vitest, runs once (use `npm run test:watch` to watch)
- `npm run build`: static build into `frontend/dist`

`frontend/src/main.jsx` mounts `App` inside a `BrowserRouter` and
`AppProviders` (OIDC session and member-service client);
`frontend/src/App.jsx` holds the routes. Code that talks to member-service
goes through the client in `frontend/src/api/client.js` (`useApi()`), and
roles come from `useSession()` in `frontend/src/auth/useSession.js`. Show
Belts with `beltName()` from `frontend/src/belts/belt.js`, next to a
`<BeltBadge>` (`frontend/src/belts/BeltBadge.jsx`) where the list or history
shows them. Styles take every colour, size and radius from the tokens in
`frontend/src/styles/tokens.css` (dark mode follows the device setting);
buttons are primary by default, `btn-secondary` or `btn-danger` otherwise. The Member detail
page (`frontend/src/members/MemberPage.jsx`) is one section component per
part of the record in `frontend/src/members/detail/`. `/profile`
(`frontend/src/profile/ProfilePage.jsx`) shows the logged-in person's own
Member record, their Profile, through member-service's `/profile` endpoints,
reusing those sections and `MemberForm`; without a Member record it offers
to create one. `/eligible` (`frontend/src/eligible/EligiblePage.jsx`, menu
item Berettiget) lists the Members of every Club who are Eligible for a Dan
or Poom on a date the Instructor or Admin picks, from member-service's
`/eligible`. Tests live next to the
code as `*.test.jsx`; `frontend/src/test/` holds the setup file, the render
helper and the MSW handlers, with member-service fixtures (Clubs, Belts,
Members) in `frontend/src/test/memberService.js`.

## Deploy

Pushing a tag matching `v*` runs `.github/workflows/deploy.yml`: install,
test, build with `frontend/.env`, then upload `frontend/dist` to one.com over
SFTP. Failing tests stop it before any upload. `frontend/public/.htaccess`
rewrites every non-file path to `index.html` so SPA routes survive a reload.
The SFTP connection comes from the repository secrets `SFTP_HOST`,
`SFTP_USER` and `SFTP_PASSWORD`. Steps and first-deploy notes are in
[docs/deploy.md](docs/deploy.md). Don't push tags unless asked to deploy.

## Testing

Tests check what a user sees and does, and which HTTP requests reach
member-service. Render the whole app at a route with
`renderApp(path, { as: 'admin' | 'instructor' | 'member' | null })` from
`frontend/src/test/renderApp.jsx`: it logs the person in by seeding
sessionStorage with an `oidc-client-ts` user whose fake access token carries
their realm roles. MSW (`frontend/src/test/server.js`) stands in for
member-service and Keycloak; override a handler in a test with
`server.use(...)`. Don't mock app modules or assert on component internals.

Tests run in Danish: `frontend/src/test/setup.js` pins the browser language
to Danish before each test, so assert Danish texts. A test about language
detection sets its own with `setBrowserLanguages([...])` from
`frontend/src/test/browser.js`.

## Decisions

ADRs live in `docs/adr/`. Read the ones touching your area before changing
it, and add one for decisions that are hard to reverse and surprising
without context.

## Issues

Issues and specs live in this repo's GitHub Issues; use `gh`.
