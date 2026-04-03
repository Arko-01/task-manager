# Team Task Manager

A simple, intuitive team task management tool built with a Notion-like minimalist design. Designed for teams not used to complex PM tools.

## Features

- **4 Views** — List, Kanban board, Calendar, and Gantt chart
- **Teams & Sub-teams** — Granular 11-permission role system
- **Task Management** — 2-level sub-tasks, multiple assignees (primary/secondary), dependencies, recurring tasks
- **Real-time Chat** — 1-on-1, team, and group conversations with WhatsApp-style read receipts (✓✓), date separators, and message notifications
- **Command Palette** — Quick actions and search with `Ctrl+K`
- **Auto-notifications** — Triggered on assignment, comments, and status changes
- **Bulk Actions** — Status, priority, assignee, and date operations
- **Task Templates** — Save and reuse common task patterns
- **Dark Mode** — Full support across all components
- **Mobile Responsive** — Bottom navigation bar for mobile devices
- **Accessibility** — WCAG AA contrast, ARIA labels, keyboard navigation, axe-core audited
- **Trash & Restore** — 30-day soft delete with recovery

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Hosting:** Vercel (frontend) + Supabase (backend)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key

# Start dev server
npm run dev

# Production build
npm run build
```

## Database Setup

Run the SQL migrations in order in your Supabase SQL Editor:

1. `supabase/migrations/001_*.sql` — Base schema
2. `supabase/migrations/002_*.sql` — Chat system
3. `supabase/migrations/003_*.sql` — Notifications
4. `supabase/migrations/004_*.sql` — Sub-teams & permissions
5. `supabase/migrations/005_restrict_profiles_rls.sql` — Profile visibility restrictions
6. `supabase/migrations/006_notification_triggers.sql` — Auto-notification triggers
7. `supabase/migrations/007_trash_purge_cron.sql` — Auto-purge trashed tasks after 30 days (requires pg_cron extension — enable in Dashboard > Database > Extensions first)
8. `supabase/migrations/008_chat_message_notifications.sql` — Chat message notification trigger (notifies all conversation members on new message)

## RBAC & Permissions

4 roles with 12 granular permissions: Admin, Sub-Team Manager, Member, Viewer. Enforced at both database (RLS) and UI level via `usePermissions` hook. Viewers see read-only task details; only users with `create_tasks` permission see the quick-add input.

## Accessibility

Fully audited with axe-core. All interactive elements have ARIA labels, filter controls have accessible names, section headers meet WCAG AA contrast ratios, and pages use proper landmark structure.
