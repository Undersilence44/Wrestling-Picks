# Wrestling Picks Starter

Next.js + Supabase starter for a multi-league pro wrestling picks app.

## Setup

1. Create a new Supabase project. A new clean project is recommended for smoother deployment.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
4. Install and run:

```bash
npm install
npm run dev
```

5. In Supabase Auth settings, set your Site URL:
   - Local: `http://localhost:3000`
   - Vercel: your production URL

6. Deploy to Vercel and add the same env vars there.

## App Structure

- Home: welcome page and overview
- Rules: editable rules page
- Leagues: public league browser, create league, join league
- Events: member event voting/picks
- Leaderboard: league-scoped standings
- Account: profile and password reset tools
- Admin Dashboard: LM/ALM event and match management

## Supabase Environment

This starter uses the current Supabase publishable key format, not the older anon key name.

Required local environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

The included `.env.local` already has the project URL and publishable key you provided. Do not commit service role keys to GitHub.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database

Run `supabase/schema.sql` in the Supabase SQL editor before testing signup, leagues, events, picks, and leaderboards.

## v6 Admin + Match Options Update

This build adds:

- LM-only league deletion from Admin Dashboard
- LM-only ALM assignment/removal from Admin Dashboard
- ALM can create/edit events and matches and set winners
- Match title/description field, for example `Roman vs Cody for WWE Title`
- Up to 6 pick options per match
- Unused match option fields can be left blank

For an existing Supabase database, run this migration after your original schema:

```sql
supabase/migrations/20260506_admin_league_match_options.sql
```

For a brand new Supabase project, run:

```sql
supabase/schema.sql
```
