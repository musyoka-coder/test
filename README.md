# Quiet Reset Kenya

Next.js, Tailwind CSS, Supabase Auth and Postgres. Requests do not collect payments.

## Configuration

Run `npm ci` and `npm run dev`. Apply the SQL migration to a dedicated project. Set these environment variables on the server.

- `SUPABASE_URL` is the project API URL.
- `SUPABASE_PUBLISHABLE_KEY` is the public Supabase publishable key. No service-role key is needed.
- `APP_URL` is the canonical origin. When omitted on Vercel the app uses the deployment URL.

In Supabase Auth enable email and password signup and email confirmation. Allow the preview and production callback URLs at `/auth/verify` (including query variants if needed). Set the production Site URL. Configure SMTP for external guest delivery. Verification and recovery use the original browser's PKCE cookie.

Give a verified account admin access from the Supabase SQL Editor by updating `public.profiles.is_admin` for that user's UUID. Never authorize the account by trusting client metadata.

The launch seed contains only package pricing. The sample cabin is presentation content. Add an approved host and publish a cabin from the admin dashboard to populate live inventory.

The initial photo illustrates the cabin concept. Source is the [Kirinyaga County photo on Twende Sasa](https://twendesasa.com/list-of-best-places-to-visit-in-kirinyaga-county/).
