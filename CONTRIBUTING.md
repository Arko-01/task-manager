# Contributing to Team Task Manager

Thanks for helping build this project! This guide explains how to contribute.

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Arko-01/task-manager.git
cd task-manager
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your Supabase URL and anon key. Ask Arko if you don't have them.

### 3. Run the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Branching

**Never push directly to `main`.** Always create a feature branch:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Branch naming conventions:

| Prefix | Use for |
|---|---|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Refactoring, deps, config |
| `docs/` | Documentation only |
| `a11y/` | Accessibility improvements |

## Commit Messages

Follow the existing commit style — short prefix + description:

```
fix: resolve sign-out not redirecting to login
feature: add recurring task UI
docs: update README with setup instructions
a11y: add ARIA labels to filter controls
chore: upgrade vite to v8
```

Keep commits focused. One logical change per commit.

## Pull Requests

1. Push your branch: `git push -u origin feature/your-feature-name`
2. Open a PR on GitHub targeting `main`
3. Write a short description of what changed and why
4. Wait for Arko's review and approval before merging

PRs must be approved before they can be merged into `main`.

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **React 19** — functional components, hooks only
- **Tailwind CSS** — utility classes, no custom CSS files
- **Zustand** — for all global state (`src/store/`)
- **Supabase** — all backend calls go through `src/lib/supabase.ts`

## Project Structure

```
src/
  components/   # UI components by feature (auth, tasks, chat, layout, ui)
  pages/        # Route pages
  store/        # Zustand stores
  hooks/        # Custom React hooks
  lib/          # Supabase client, utilities
  types/        # TypeScript interfaces
supabase/
  migrations/   # SQL migrations (001-007)
  functions/    # Edge Functions
```

## Things to Avoid

- **Don't commit `.env`** — it contains secrets
- **Don't modify SQL migrations** without discussing first — they affect production
- **Don't install new dependencies** without checking with Arko
- **Don't push directly to `main`** — always open a PR

## Database

If you need to make schema changes:

1. Create a new migration file in `supabase/migrations/`
2. Number it sequentially (next is `008_`)
3. Include both the change and any necessary RLS policies
4. Document it in the PR description

## Need Help?

Check `CLAUDE.md` for detailed technical context about the project architecture, test accounts, and known patterns.
