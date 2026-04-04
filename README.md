# Team Task Manager

A simple, intuitive team task management tool built with a Notion-like minimalist design. Designed for teams not used to complex PM tools.

## Features

- **6 Views** — List, Kanban board, Calendar, Gantt chart, Table (spreadsheet), and Reports/Analytics
- **Teams & Sub-teams** — 6 roles (admin, sub-team manager, project lead, task lead, member, viewer) with 12 granular permissions
- **Task Management** — 5 task types, 2-level sub-tasks, multiple assignees, dependencies, recurring tasks, time tracking, milestones
- **Project Management** — Templates, project dependencies, workspace folders (hierarchy), custom statuses per project
- **Real-time Chat** — 1-on-1, team, and group conversations with WhatsApp-style read receipts (✓✓), date separators, scheduled messages
- **Search & Filters** — `@name`, `#tag`, `due:range` structured queries, full-text search (PostgreSQL FTS), filter pills
- **Command Palette** — Quick actions and search with `Ctrl+K`
- **Auto-notifications** — Triggered on assignment, comments, status changes, and chat messages
- **Bulk Actions** — Status, priority, assignee, and date operations
- **Task Templates** — Save and reuse common task patterns
- **Export** — CSV, PDF (jsPDF), and iCal calendar export
- **Reports** — Status distribution, workload, priority breakdown, completion trend charts
- **Dark Mode** — Full support across all components
- **Mobile Responsive** — Bottom navigation, FAB task creation, mobile-optimized calendar/gantt
- **Accessibility** — WCAG AA contrast, ARIA labels, keyboard navigation, focus trapping, axe-core audited
- **Onboarding** — Interactive 5-step tour, expanded welcome checklist, contextual help tooltips
- **Customization** — Brand colors, workspace logo, custom statuses
- **Audit & Activity** — Activity feed, admin audit log viewer
- **Trash & Restore** — 30-day soft delete with recovery, task archiving
- **Help Center** — FAQ, troubleshooting guide, team setup guide, system status page

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand + recharts + jsPDF
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
9. `supabase/migrations/009_tags_and_mentions.sql` — Tags column on tasks (GIN-indexed), team_tags table for suggestions, mentions column on comments
10. `supabase/migrations/010_enhancements.sql` — Task types, time tracking, milestones, templates, project dependencies, activity/audit logs, FTS, favorites, archive, extended roles, profile extensions, brand customization

## RBAC & Permissions

6 roles with 12 granular permissions: Admin, Sub-Team Manager, Project Lead, Task Lead, Member, Viewer. Enforced at both database (RLS) and UI level via `usePermissions` hook. Viewers see read-only task details; only users with `create_tasks` permission see the quick-add input.

## Accessibility

Fully audited with axe-core. All interactive elements have ARIA labels, filter controls have accessible names, section headers meet WCAG AA contrast ratios, and pages use proper landmark structure.
