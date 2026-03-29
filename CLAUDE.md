# Team Task Manager

## Project Overview
A simple, intuitive team task management tool for teams not used to complex PM tools.
Design philosophy: **Notion-like minimalism** — clean whitespace, subtle borders, neutral palette, calm UI.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions) — no separate server
- **Hosting:** Vercel (frontend) + Supabase (backend) — $0 cost

## Key URLs
- **Production:** https://task-manager-eight-vert-91.vercel.app
- **GitHub:** https://github.com/Arko-01/task-manager
- **Supabase project ref:** iojyzntejrxjtnuyfgrs
- **Supabase dashboard:** https://supabase.com/dashboard/project/iojyzntejrxjtnuyfgrs

## Project Structure
- `src/store/` — Zustand stores (authStore, teamStore, projectStore, taskStore, chatStore, notificationStore)
- `src/components/` — UI components organized by feature (layout, auth, team, project, tasks, chat, notifications, search, ui, admin)
- `src/pages/` — Route pages (Login, Signup, Dashboard, TeamDashboard, Project, Admin, Profile, Trash)
- `src/lib/supabase.ts` — Supabase client
- `src/types/` — TypeScript interfaces
- `supabase/migrations/` — SQL schema and RLS policy migrations (001-006)
- `supabase/functions/` — Edge Functions (create-team, invite-member, reorder-tasks, etc.)

## Database
- RLS enabled on all tables with helper functions: `is_team_member()`, `is_team_admin()`, `is_conversation_member()` (all SECURITY DEFINER)
- Profiles RLS restricted to self + teammates (migration 005) — no world-readable emails
- Auto-notification triggers (migration 006): task assignment, comments, status changes
- PostgREST FK joins on messages table must use explicit FK: `profiles!messages_sender_id_fkey`
- PostgREST does NOT support raw SQL subqueries in `.not()` filters — use separate queries instead
- Optimistic updates with conflict detection via `updated_at` column on tasks

## Test Accounts (on production Supabase)
- Admin: uat.tester@test.com / UatTest123!
- Alice: alice.chat@test.com / ChatTest123!
- Bob: bob.chat@test.com / ChatTest123!
- Carol: carol.chat@test.com / ChatTest123!
- Team ID: 3de9df38-7861-46a7-8a28-791adfa0f581

## Build & Deploy
- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- Vercel auto-deploys from `main` branch, or manual: `npx vercel --prod`
- SPA routing handled by `vercel.json` rewrites

## Full Implementation Plan
See: C:\Users\Asus\.claude\plans\staged-coalescing-lemon.md

## Comprehensive App Review (March 2026) — COMPLETE
See: C:\Users\Asus\.claude\plans\snug-stargazing-kitten.md
- 27 issues identified and fixed across 4 waves (all complete as of 2026-03-29)
- Wave 1 (bugs & blockers): auth listener leak, chat N+1, subscription cleanup, error boundaries, profiles RLS, date validation, filter persistence, optimistic updates + conflict detection
- Wave 2 (half-built): notification triggers (DB triggers), dependencies UI + Gantt arrows, recurring tasks UI, keyboard shortcuts
- Wave 3 (UX): onboarding guide, mobile bottom nav, command palette (Ctrl+K), bulk ops (status/priority/assign/date), task templates
- Wave 4 (polish): WCAG AA contrast, keyboard nav (Kanban cards), ARIA labels, loading skeletons
- SQL migrations 005 + 006 applied to production Supabase
