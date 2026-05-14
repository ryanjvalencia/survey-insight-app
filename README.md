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

None required for local development yet. Supabase and AI API keys will be documented here when those features are added (issues #20 and beyond).

## Architecture

See [docs/architecture.md](docs/architecture.md) for route structure, component conventions, and module layout.

## Agent build system

This project uses an agent build system. See [docs/agent-operating-system.md](docs/agent-operating-system.md) for how the build loop works and [docs/agent-prompts.md](docs/agent-prompts.md) for ready-to-run agent prompts.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full issue list and dependency order.
