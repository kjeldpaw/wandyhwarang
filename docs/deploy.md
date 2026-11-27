# Deploying to one.com

The app is served as static files by one.com's Apache at
https://wandywharang.dk. The GitHub Actions workflow
`.github/workflows/deploy.yml` deploys it when a release tag is pushed.

## What the workflow does

On a pushed tag matching `v*` it runs, in `frontend/`:

1. `npm ci`
2. `npm test`: a failing test stops the job before anything is built or
   uploaded.
3. `npm run build` with the production configuration committed in
   `frontend/.env`.
4. Checks that `dist/index.html` and `dist/.htaccess` exist.
5. Uploads `dist/` over SFTP with `lftp mirror --reverse` into the
   `REMOTE_DIR` directory of the SFTP account (the web root of
   wandywharang.dk), `www` unless the secret says otherwise.

The upload overwrites files but deletes nothing on the server (it has no
`--delete`, on purpose). Old hashed files in `assets/` and anything else
already there, including the old PHP app, stay on the server and are still
served until removed by hand.

`frontend/public/.htaccess` is copied into the build. It makes `index.html`
the directory index and rewrites every path that isn't an existing file to
`index.html`, so deep links and reloads of routes such as `/members/42` load
the app.

## One-time setup

Add these repository secrets (Settings, Secrets and variables, Actions), using
the SFTP details from the one.com control panel:

- `SFTP_HOST`: the one.com SFTP host name
- `SFTP_USER`: the SFTP user name
- `SFTP_PASSWORD`: the SFTP password
- `REMOTE_DIR` (optional): the web root's path in the SFTP account. Without
  it the upload goes to `www`.

The workflow accepts the server's SSH host key on first contact
(`sftp:auto-confirm`), because there is no pinned known-hosts entry.

## Releasing

From an up-to-date `main`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Follow the run under the repository's Actions tab. To redeploy the same
code, push a new tag; re-running a failed run is fine too.

## First deploy

The first deploy lands next to the old PHP app. `DirectoryIndex index.html`
makes `/` serve the new app even though the old `index.php` is still there.
After manual acceptance (log in as Admin, Instructor and Member, switch
language, create a Member and receive the email, record a Graduation with an
Examiner from another Club, reload a deep link, log out), delete the old PHP
files from the web root and the old MySQL database in the one.com control
panel (go-live, wandyhwarang#11).

No deploy does this for you: the upload never deletes, so the old PHP files
(and the personal data the old app can still reach) stay served until they are
removed by hand. Don't skip this step, or stale personal data is left behind.
