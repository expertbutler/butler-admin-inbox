# butler-inbox

A super-admin-only view of every WhatsApp conversation between hotel guests and the AI concierge,
across all hotels. Companion to [`butler-da`](https://github.com/expertbutler/butler-da).

**Working on this repo — human or AI — starts with [AGENTS.md](./AGENTS.md).**

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in the three values
npm run dev
```

There is no database to run. This app reads the shared Supabase project directly and sends every
write to `butler-da`, so there is nothing to install beyond the packages above.

## Environment

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project to read conversations from |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Its public key — read-only in practice, gated by row-level security |
| `BUTLER_DA_API_URL` | The `butler-da` deployment that performs every write |

That is the complete set. Adding a fourth is not a normal change — see AGENTS.md, rule 2.

## Deploying

`main` deploys to production. Pull requests get a preview deployment pointed at the development
database. Open a PR, check the preview, then merge.

## What this app deliberately cannot do

- Change the database schema. It has no migration tooling and no credential that could.
- Write to the database directly. Every write goes through `butler-da`.
- Start a conversation with a guest who hasn't messaged first.
