# Build Outline

## Recommended Supabase Project
Yes: start a new Supabase project for this build. It keeps the schema clean, avoids old RLS conflicts, and makes Vercel deployment smoother.

## Core Data Model
- `profiles`: account profile data mirrored from Supabase Auth.
- `leagues`: public/private leagues with scoring settings.
- `league_members`: league roles: LM, ALM, Officer, Member.
- `events`: league event cards with date, status, perfect bonus.
- `matches`: competitors and winner per match.
- `picks`: each user's match picks and confidence ranks.
- `interference_bets`: add/subtract wager system.
- `event_results`: finalized event scoring summary.
- `leaderboard_view`: league-scoped leaderboard.

## Role Rules
- LM: full league control, can delete league, remove members, appoint ALM, create/edit events, set winners.
- ALM: can create/edit events and matches, set winners.
- Officer: no special admin permissions.
- Member: can submit picks in leagues they belong to.

## Scoring Rules
- Ranked: confidence rank points are awarded when the pick is correct.
- Fixed: each correct pick gets `fixed_points`.
- Fantasy: placeholder/coming soon.
- Perfect event bonus defaults to 5, editable by LM/event admin.
- Interference bets must be >= 0 and should not exceed current season points.

## Next Build Steps
1. Run SQL.
2. Create first user.
3. Create league.
4. Create event and matches.
5. Submit picks.
6. Add a finalize-event server action to calculate `event_results` after winners are set.
7. Add invite UI for private leagues.
8. Add LM-only ALM assignment screen.
