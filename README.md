# Survey Insight

Turn messy survey and customer feedback CSV files into clean insights, charts, and downloadable reports.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |

## Required environment variables

Create `.env.local` at the project root (gitignored — never commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase project via the **Connect** button (or **Project Settings → Data API / API Keys**). Use the **Project URL** and the **publishable** (or legacy **anon**) key only. Never put the secret / service role key in a `NEXT_PUBLIC_` variable.

## Database setup

Run each file in [`supabase/migrations/`](supabase/migrations/) in filename order, in the Supabase dashboard under **SQL Editor → New query**. They are idempotent, so re-running is safe. The first file (`..._baseline_schema.sql`) creates the original tables for fresh databases, such as Supabase preview branches; on an existing database it does nothing.

Authentication uses Supabase email + password. Email confirmation is controlled in the dashboard under **Authentication → Sign In / Providers → Email**.

## Architecture

See [docs/architecture.md](docs/architecture.md) for route structure, component conventions, and module layout.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for what's done and the path to launch.
