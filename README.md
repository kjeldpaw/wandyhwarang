# Wandy Wha Rang frontend

Single-page app for managing the Members, Clubs, Graduations and References
of Wandy Wha Rang. It is hosted as static files at one.com on
https://wandywharang.dk, uses member-service as its only backend and Keycloak
for login. See [AGENTS.md](AGENTS.md) for the architecture.

## Development

Requires Node.js 20 or later.

```bash
cd frontend
npm install
npm run dev      # dev server on http://localhost:3000
npm test         # run the tests once
npm run build    # static build in frontend/dist
```
