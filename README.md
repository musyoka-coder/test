# Quiet Reset Kenya

Rural stay catalog, guest bookings, host applications, and admin review. The Next.js app uses Supabase Auth and Postgres. Requests do not collect payments.

## Run from a fresh clone

Use Node.js 24 and the committed npm lockfile.

```sh
npm ci
npm run dev
```

Without Supabase credentials, the public pages show the launch catalog and write operations are unavailable. Tests, lint, type checks, and the production build run without an external Supabase account.

## Local database and authentication

Install Docker and a PostgreSQL client (`psql`). The Supabase CLI is installed by npm.

```sh
npm run db:start
npm run db:seed
cp .env.example .env.local
npm run db:test
npm run dev
```

`db:seed` resets the **local** database and loads schema migrations and the package seed. Use the publishable key printed by `db:start` in `.env.local`. Local verification and reset emails arrive at [Mailpit](http://localhost:54324). Use the application at [localhost](http://localhost:3000) to match the callback origin.

For hosted deployments set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `APP_URL`. Vercel supplies `VERCEL_URL` automatically as a fallback. Add the canonical site's `/auth/verify` callback and its query variants to the Supabase redirect allowlist. Configure SMTP for external guest delivery. Verification and recovery use the original browser's PKCE cookie. No service-role key is required.

Grant admin access by setting `public.profiles.is_admin` for the verified user's UUID from the Supabase SQL editor. Never use user-editable metadata as an admin claim.

## Architecture and checks

Pages render the catalog and dashboard. Server actions validate form data and enforce CSRF protection. Supabase RLS and transactional functions enforce ownership, admin access, and booking constraints. The sample cabin stays outside live inventory. `GET /api/health` checks whether the package API responds and returns 503 when unavailable. Server errors log an operation and sanitized code.

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run audit
```

The launch photograph is illustrative. [Kirinyaga County photo on Twende Sasa](https://twendesasa.com/list-of-best-places-to-visit-in-kirinyaga-county/).
