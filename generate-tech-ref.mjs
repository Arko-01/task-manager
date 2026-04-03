import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition,
  TableOfContents
} from 'docx';
import fs from 'fs';
import path from 'path';

const SS_DIR = path.join(process.cwd(), 'tech-ref-screenshots');
const FONT = 'Arial';
const COLOR_PRIMARY = '4F46E5';
const COLOR_HEADER_BG = '4F46E5';
const COLOR_HEADER_TEXT = 'FFFFFF';
const COLOR_ALT_ROW = 'F5F3FF';
const COLOR_BORDER = 'D1D5DB';
const COLOR_DARK = '1F2937';
const COLOR_GRAY = '6B7280';

const border = { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

const PAGE_WIDTH = 12240;
const MARGIN = 1200;
const CW = PAGE_WIDTH - 2 * MARGIN; // content width

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, font: FONT, size: 32, color: COLOR_DARK })] });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, bold: true, font: FONT, size: 26, color: '374151' })] });
}
function heading3(text) {
  return new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text, bold: true, font: FONT, size: 22, color: COLOR_PRIMARY })] });
}
function para(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: FONT, size: 21, color: COLOR_DARK, ...opts })] });
}
function paraMulti(...runs) {
  return new Paragraph({ spacing: { after: 120 }, children: runs.map(r => typeof r === 'string' ? new TextRun({ text: r, font: FONT, size: 21, color: COLOR_DARK }) : new TextRun({ font: FONT, size: 21, color: COLOR_DARK, ...r })) });
}
function code(text) {
  return new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text, font: 'Courier New', size: 18, color: '7C3AED' })] });
}
function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function img(name, caption, widthPx = 560, heightPx = 350) {
  const p = path.join(SS_DIR, `${name}.png`);
  if (!fs.existsSync(p)) { console.log(`  [missing] ${name}.png`); return []; }
  const buf = fs.readFileSync(p);
  const children = [
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [new ImageRun({ type: 'png', data: buf, transformation: { width: widthPx, height: heightPx },
        altText: { title: caption, description: caption, name } })],
    }),
    new Paragraph({ spacing: { after: 150 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: caption, font: FONT, size: 18, italics: true, color: COLOR_GRAY })] }),
  ];
  return children;
}

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: FONT, size: 18, color: COLOR_HEADER_TEXT })] })]
  });
}
function cell(text, width, alt = false) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: alt ? { fill: COLOR_ALT_ROW, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 18, color: COLOR_DARK })] })]
  });
}
function boldCell(text, width, alt = false) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: alt ? { fill: COLOR_ALT_ROW, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: FONT, size: 18, color: COLOR_DARK })] })]
  });
}

function schemaTable(columns, rows) {
  const colWidths = columns.map((_, i) => {
    if (columns.length === 3) return [3000, 2000, CW - 5000][i];
    if (columns.length === 4) return [2200, 1800, 1800, CW - 5800][i];
    return Math.floor(CW / columns.length);
  });
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: columns.map((c, i) => headerCell(c, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((val, ci) => ci === 0 ? boldCell(val, colWidths[ci], ri % 2 === 1) : cell(val, colWidths[ci], ri % 2 === 1))
      }))
    ]
  });
}

function simpleTable(columns, rows, colWidths) {
  if (!colWidths) colWidths = columns.map(() => Math.floor(CW / columns.length));
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: columns.map((c, i) => headerCell(c, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((val, ci) => cell(val, colWidths[ci], ri % 2 === 1))
      }))
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: COLOR_DARK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: '374151' },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: 15840 },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        children: [new TextRun({ text: 'Team Task Manager \u2014 Technical Reference', font: FONT, size: 16, color: '9CA3AF' })],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Page ', font: FONT, size: 16, color: '9CA3AF' }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '9CA3AF' })],
      })] }),
    },
    children: [
      // ══════════ COVER PAGE ══════════
      new Paragraph({ spacing: { before: 4000 }, alignment: AlignmentType.CENTER, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Team Task Manager', font: FONT, size: 56, bold: true, color: COLOR_PRIMARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Technical Reference & UI/UX Review Guide', font: FONT, size: 36, color: COLOR_GRAY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Version 1.0 \u2014 April 2026', font: FONT, size: 22, color: '9CA3AF' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Part A: Architecture \u2022 Database \u2022 Design System \u2022 Permissions', font: FONT, size: 22, italics: true, color: COLOR_GRAY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Part B: Screen Walkthrough \u2022 Dark Mode \u2022 Mobile \u2022 Review Checklist', font: FONT, size: 22, italics: true, color: COLOR_GRAY })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ TABLE OF CONTENTS ══════════
      heading1('Table of Contents'),
      new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 1: ARCHITECTURE ══════════
      heading1('1. Architecture Overview'),
      heading2('1.1 System Architecture'),
      para('Team Task Manager is a single-page application (SPA) with no custom backend server. All server-side logic is handled by Supabase services and PostgreSQL database triggers.'),
      emptyLine(),
      heading3('Data Flow'),
      code('React 19 SPA (Vercel) \u2192 Supabase JS Client \u2192 Supabase Platform'),
      code('  \u251C\u2500 Auth (JWT-based authentication)'),
      code('  \u251C\u2500 PostgreSQL (data + RLS + triggers)'),
      code('  \u251C\u2500 Realtime (WebSocket subscriptions)'),
      code('  \u2514\u2500 Storage (avatars, attachments)'),
      emptyLine(),
      heading2('1.2 Tech Stack'),
      simpleTable(['Layer', 'Technology', 'Version'], [
        ['Framework', 'React + TypeScript', '19.2 + 5.9'],
        ['Build Tool', 'Vite', '8.0'],
        ['Styling', 'Tailwind CSS', '4.2'],
        ['State', 'Zustand', '5.0'],
        ['Backend', 'Supabase (PostgreSQL + Auth + Realtime)', '2.100'],
        ['Hosting', 'Vercel (frontend)', '\u2014'],
        ['Drag & Drop', '@dnd-kit/core + @dnd-kit/sortable', '6.3 + 10.0'],
        ['Calendar', '@fullcalendar/react', '6.1'],
        ['Date Utils', 'date-fns', '4.1'],
        ['Icons', 'lucide-react', '1.7'],
        ['Router', 'react-router-dom', '7.13'],
      ], [3000, 4600, 2240]),
      emptyLine(),
      heading2('1.3 Project Structure'),
      code('src/'),
      code('  \u251C\u2500 components/    # UI components by feature'),
      code('  \u2502   \u251C\u2500 auth/       # Login, Signup, ProtectedRoute'),
      code('  \u2502   \u251C\u2500 layout/     # AppLayout, Header, Sidebar, BottomNav'),
      code('  \u2502   \u251C\u2500 tasks/      # All task views + detail + filters'),
      code('  \u2502   \u251C\u2500 chat/       # ChatPanel'),
      code('  \u2502   \u251C\u2500 notifications/  # NotificationDropdown'),
      code('  \u2502   \u251C\u2500 search/     # GlobalSearch (command palette)'),
      code('  \u2502   \u251C\u2500 onboarding/ # WelcomeGuide'),
      code('  \u2502   \u251C\u2500 project/    # CreateProjectModal'),
      code('  \u2502   \u251C\u2500 team/       # TeamSwitcher, InviteModal'),
      code('  \u2502   \u2514\u2500 ui/         # Shared: Button, Modal, Toast, etc.'),
      code('  \u251C\u2500 hooks/         # usePermissions'),
      code('  \u251C\u2500 lib/           # supabase.ts client'),
      code('  \u251C\u2500 pages/         # Route pages'),
      code('  \u251C\u2500 store/         # Zustand stores (6 stores)'),
      code('  \u2514\u2500 types/         # TypeScript interfaces'),
      code('supabase/'),
      code('  \u251C\u2500 migrations/    # SQL migrations 001\u2013007'),
      code('  \u2514\u2500 functions/     # (Edge Functions \u2014 unused, logic in stores)'),
      new Paragraph({ children: [new PageBreak()] }),

      // ── Screenshots: Login & Signup ──
      heading2('1.4 Login & Authentication Screens'),
      ...img('01_login_empty', 'Figure 1.1 \u2014 Login page (empty state)'),
      ...img('02_login_validation_errors', 'Figure 1.2 \u2014 Login form validation errors'),
      ...img('03_login_invalid_credentials', 'Figure 1.3 \u2014 Invalid credentials error'),
      ...img('04_signup_form', 'Figure 1.4 \u2014 Sign-up form'),
      ...img('05_signup_validation_errors', 'Figure 1.5 \u2014 Sign-up form validation errors'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 2: DATABASE SCHEMA ══════════
      heading1('2. Database Schema'),
      para('All tables are in the public schema. RLS is enabled on every table. The database uses PostgreSQL via Supabase.'),
      emptyLine(),

      heading2('2.1 profiles'),
      para('Auto-created on sign-up via the handle_new_user() trigger.'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, references auth.users(id) ON DELETE CASCADE'],
        ['email', 'text', 'NOT NULL'],
        ['full_name', 'text', 'nullable'],
        ['avatar_url', 'text', 'nullable'],
        ['timezone', 'text', "DEFAULT 'UTC'"],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.2 teams'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['name', 'text', 'NOT NULL'],
        ['description', 'text', 'nullable'],
        ['created_by', 'uuid', 'FK \u2192 profiles(id)'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.3 team_members'),
      para('Links users to teams with role and custom permissions.'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['team_id', 'uuid', 'FK \u2192 teams(id) ON DELETE CASCADE, NOT NULL'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, NOT NULL'],
        ['role', 'text', "CHECK (admin|sub_team_manager|member|viewer), DEFAULT 'member'"],
        ['permissions', 'jsonb', 'DEFAULT (12-key permission object)'],
        ['joined_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      para('Unique constraint: UNIQUE(team_id, user_id)', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.4 sub_teams'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['team_id', 'uuid', 'FK \u2192 teams(id) ON DELETE CASCADE, NOT NULL'],
        ['name', 'text', 'NOT NULL'],
        ['manager_id', 'uuid', 'FK \u2192 profiles(id)'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.5 sub_team_members'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['sub_team_id', 'uuid', 'FK \u2192 sub_teams(id) ON DELETE CASCADE, NOT NULL'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, NOT NULL'],
      ]),
      para('Primary key: (sub_team_id, user_id)', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.6 projects'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['team_id', 'uuid', 'FK \u2192 teams(id) ON DELETE CASCADE, NOT NULL'],
        ['name', 'text', 'NOT NULL'],
        ['emoji', 'text', "DEFAULT '\uD83D\uDCCB'"],
        ['description', 'text', 'nullable'],
        ['is_default', 'boolean', 'DEFAULT false'],
        ['start_date', 'date', 'NOT NULL'],
        ['end_date', 'date', 'NOT NULL, CHECK(end_date >= start_date)'],
        ['created_by', 'uuid', 'FK \u2192 profiles(id)'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.7 tasks'),
      para('Core entity. Supports 2-level nesting, soft delete, recurring patterns, and optimistic update conflict detection.'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['project_id', 'uuid', 'FK \u2192 projects(id) ON DELETE CASCADE, NOT NULL'],
        ['parent_id', 'uuid', 'FK \u2192 tasks(id) ON DELETE CASCADE (self-ref)'],
        ['title', 'text', 'NOT NULL'],
        ['description', 'text', 'nullable'],
        ['status', 'text', "CHECK (todo|in_progress|on_hold|done), DEFAULT 'todo'"],
        ['priority', 'integer', 'CHECK (1\u20134), DEFAULT 3'],
        ['start_date', 'date', 'NOT NULL'],
        ['end_date', 'date', 'NOT NULL, CHECK(end_date >= start_date)'],
        ['position', 'integer', 'DEFAULT 0'],
        ['depth', 'integer', 'CHECK (0\u20132), DEFAULT 0'],
        ['is_recurring', 'boolean', 'DEFAULT false'],
        ['recurrence_pattern', 'jsonb', 'nullable'],
        ['created_by', 'uuid', 'FK \u2192 profiles(id)'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
        ['updated_at', 'timestamptz', 'DEFAULT now()'],
        ['deleted_at', 'timestamptz', 'nullable (soft delete)'],
      ]),
      emptyLine(),

      heading2('2.8 task_assignees'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['task_id', 'uuid', 'FK \u2192 tasks(id) ON DELETE CASCADE, NOT NULL'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, NOT NULL'],
        ['role', 'text', "CHECK (primary|secondary), DEFAULT 'primary'"],
      ]),
      para('Primary key: (task_id, user_id)', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.9 task_dependencies'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['task_id', 'uuid', 'FK \u2192 tasks(id) ON DELETE CASCADE, NOT NULL'],
        ['depends_on_task_id', 'uuid', 'FK \u2192 tasks(id) ON DELETE CASCADE, NOT NULL'],
        ['type', 'text', "CHECK (blocks|blocked_by), NOT NULL"],
      ]),
      para('Unique constraint: UNIQUE(task_id, depends_on_task_id). Circular dependencies prevented by BFS graph walk in the client.', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.10 comments'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['task_id', 'uuid', 'FK \u2192 tasks(id) ON DELETE CASCADE'],
        ['project_id', 'uuid', 'FK \u2192 projects(id) ON DELETE CASCADE'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id), NOT NULL'],
        ['content', 'text', 'NOT NULL'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      para('CHECK: task_id IS NOT NULL OR project_id IS NOT NULL', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.11 conversations'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['type', 'text', 'CHECK (direct|team|group), NOT NULL'],
        ['team_id', 'uuid', 'FK \u2192 teams(id) ON DELETE CASCADE, NOT NULL'],
        ['name', 'text', 'nullable'],
        ['created_by', 'uuid', 'FK \u2192 profiles(id)'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.12 conversation_members'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['conversation_id', 'uuid', 'FK \u2192 conversations(id) ON DELETE CASCADE, NOT NULL'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, NOT NULL'],
      ]),
      para('Primary key: (conversation_id, user_id)', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.13 messages'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['conversation_id', 'uuid', 'FK \u2192 conversations(id) ON DELETE CASCADE, NOT NULL'],
        ['sender_id', 'uuid', 'FK \u2192 profiles(id), NOT NULL'],
        ['content', 'text', 'NOT NULL'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.14 message_reads'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['message_id', 'uuid', 'FK \u2192 messages(id) ON DELETE CASCADE, NOT NULL'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, NOT NULL'],
        ['read_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      para('Primary key: (message_id, user_id)', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('2.15 notifications'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['id', 'uuid', 'PK, DEFAULT gen_random_uuid()'],
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, NOT NULL'],
        ['type', 'text', 'NOT NULL'],
        ['title', 'text', 'NOT NULL'],
        ['body', 'text', 'NOT NULL'],
        ['link', 'text', 'nullable'],
        ['is_read', 'boolean', 'DEFAULT false'],
        ['created_at', 'timestamptz', 'DEFAULT now()'],
      ]),
      emptyLine(),

      heading2('2.16 notification_preferences'),
      schemaTable(['Column', 'Type', 'Constraints'], [
        ['user_id', 'uuid', 'FK \u2192 profiles(id) ON DELETE CASCADE, PK'],
        ['preferences', 'jsonb', 'DEFAULT (9-event config with in_app/push booleans)'],
        ['quiet_hours_enabled', 'boolean', 'DEFAULT false'],
        ['quiet_hours_start', 'time', 'nullable'],
        ['quiet_hours_end', 'time', 'nullable'],
      ]),
      emptyLine(),

      heading2('2.17 Indexes'),
      simpleTable(['Index Name', 'Table.Column'], [
        ['idx_team_members_user', 'team_members.user_id'],
        ['idx_team_members_team', 'team_members.team_id'],
        ['idx_sub_team_members_sub', 'sub_team_members.sub_team_id'],
        ['idx_sub_team_members_user', 'sub_team_members.user_id'],
        ['idx_projects_team', 'projects.team_id'],
        ['idx_tasks_project', 'tasks.project_id'],
        ['idx_tasks_parent', 'tasks.parent_id'],
        ['idx_tasks_status', 'tasks.status'],
        ['idx_tasks_deleted', 'tasks.deleted_at'],
        ['idx_task_assignees_user', 'task_assignees.user_id'],
        ['idx_comments_task', 'comments.task_id'],
        ['idx_comments_project', 'comments.project_id'],
        ['idx_messages_conversation', 'messages.conversation_id'],
        ['idx_messages_created', 'messages.created_at'],
        ['idx_notifications_user', 'notifications.user_id'],
        ['idx_notifications_read', 'notifications.is_read'],
      ], [5000, CW - 5000]),
      emptyLine(),

      heading2('2.18 Helper Functions (SECURITY DEFINER)'),
      simpleTable(['Function', 'Returns', 'Description'], [
        ['is_team_member(p_team_id)', 'boolean', 'Checks if auth.uid() is a member of the team'],
        ['is_team_admin(p_team_id)', 'boolean', 'Checks if auth.uid() is an admin of the team'],
        ['is_conversation_member(conv_id)', 'boolean', 'Checks if auth.uid() is in a conversation'],
        ['handle_new_user()', 'trigger', 'Auto-creates profiles row on auth.users INSERT'],
        ['update_modified_column()', 'trigger', 'Sets updated_at = now() before UPDATE on tasks'],
      ], [3500, 1500, CW - 5000]),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 3: RLS ══════════
      heading1('3. Row Level Security (RLS)'),
      para('RLS is enabled on every table. All policies use SECURITY DEFINER helper functions to check team membership. This ensures data isolation between teams.'),
      emptyLine(),
      simpleTable(['Table', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'], [
        ['profiles', 'Self + teammates', '\u2014 (trigger)', 'Self only', '\u2014'],
        ['teams', 'Members only', 'Authenticated', 'Admin only', '\u2014'],
        ['team_members', 'Team members', 'Admin or self-join', 'Admin only', 'Admin only'],
        ['sub_teams', 'Team members', 'Admin only', 'Admin only', 'Admin only'],
        ['sub_team_members', 'Team members', 'Admin only', '\u2014', 'Admin only'],
        ['projects', 'Team members', 'Team members', 'Team members', 'Admin (non-default)'],
        ['tasks', 'Team members', 'Team members', 'Team members', 'Team members'],
        ['task_assignees', 'Team members', 'Team members', '\u2014', 'Team members'],
        ['task_dependencies', 'Team members', 'Team members', '\u2014', 'Team members'],
        ['comments', 'Team members', 'Self (user_id)', '\u2014', 'Self (user_id)'],
        ['conversations', 'Creator or member', 'Creator + team member', '\u2014', '\u2014'],
        ['conversation_members', 'Conv. members', 'Team members', '\u2014', '\u2014'],
        ['messages', 'Conv. members', 'Self + conv. member', '\u2014', '\u2014'],
        ['message_reads', 'Self only', 'Self only', 'Self only', '\u2014'],
        ['notifications', 'Self only', '\u2014 (trigger)', 'Self only', '\u2014'],
        ['notification_prefs', 'Self only', 'Self only', 'Self only', '\u2014'],
      ], [1800, 1800, 1800, 1800, CW - 7200]),
      emptyLine(),
      para('Note: "Team members" means the RLS policy checks is_team_member(team_id) by traversing the foreign key chain (e.g., tasks \u2192 projects \u2192 teams).', { italics: true, color: COLOR_GRAY }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 4: TRIGGERS & CRON ══════════
      heading1('4. Database Triggers & Cron'),
      heading2('4.1 Notification Triggers (Migration 006)'),
      simpleTable(['Trigger', 'Event', 'Action'], [
        ['trg_notify_task_assigned', 'AFTER INSERT on task_assignees', 'Creates notification for assignee (skips self-assign)'],
        ['trg_notify_task_comment', 'AFTER INSERT on comments', 'Notifies all task assignees except the commenter'],
        ['trg_notify_task_status', 'AFTER UPDATE on tasks', 'Notifies all assignees when status changes (skips if deleted)'],
      ], [3000, 3200, CW - 6200]),
      emptyLine(),
      heading2('4.2 Cron Job (Migration 007)'),
      para('Job: purge-old-trash'),
      paraMulti({ text: 'Schedule: ', bold: true }, 'Daily at 3:00 AM UTC via pg_cron'),
      paraMulti({ text: 'Action: ', bold: true }, 'DELETE FROM tasks WHERE deleted_at < now() - interval \'30 days\''),
      paraMulti({ text: 'Requirement: ', bold: true }, 'pg_cron extension must be enabled manually in Supabase Dashboard > Database > Extensions'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 5: AUTH FLOW ══════════
      heading1('5. Authentication Flow'),
      heading2('5.1 Sign Up'),
      para('1. User fills SignupForm (full_name, email, password, confirm password) with client-side validation (noValidate + React state-based errors).'),
      para('2. Calls supabase.auth.signUp() with full_name in options.data metadata.'),
      para('3. The handle_new_user() trigger auto-creates a profiles row from auth.users metadata.'),
      para('4. Supabase sends a confirmation email. User must confirm before logging in.'),
      emptyLine(),
      heading2('5.2 Sign In'),
      para('1. User fills LoginForm with client-side validation.'),
      para('2. Calls supabase.auth.signInWithPassword().'),
      para('3. On error: inline error message "Invalid email or password."'),
      para('4. On success: onAuthStateChange fires, sets user + session, fetches profile.'),
      para('5. ProtectedRoute detects user and renders AppLayout.'),
      emptyLine(),
      heading2('5.3 Session Management'),
      para('On app mount, authStore.initialize() calls supabase.auth.getSession() to restore an existing session, then subscribes to onAuthStateChange for token refresh events. The previous subscription is cleaned up before creating a new one to prevent memory leaks.'),
      emptyLine(),
      heading2('5.4 Sign Out'),
      para('1. Unsubscribes the auth state listener.'),
      para('2. Calls supabase.auth.signOut() (wrapped in try/catch).'),
      para('3. In the finally block: clears user, profile, session to null.'),
      para('4. Force redirects to /login via window.location.href (handles edge cases where auth listener fails to fire).'),
      new Paragraph({ children: [new PageBreak()] }),

      // ── Screenshots: Dashboard Views ──
      heading2('5.5 Application Screenshots'),
      ...img('06_dashboard_list_view', 'Figure 5.1 \u2014 Dashboard \u2014 List View (default landing)'),
      ...img('10_sidebar_navigation', 'Figure 5.2 \u2014 Sidebar navigation with project list'),
      ...img('07_dashboard_board_view', 'Figure 5.3 \u2014 Dashboard \u2014 Kanban Board View'),
      ...img('08_dashboard_calendar_view', 'Figure 5.4 \u2014 Dashboard \u2014 Calendar View'),
      ...img('09_dashboard_gantt_view', 'Figure 5.5 \u2014 Dashboard \u2014 Gantt View'),
      ...img('11_task_detail_panel', 'Figure 5.6 \u2014 Task Detail slide-in panel'),
      ...img('12_task_detail_bottom', 'Figure 5.7 \u2014 Task Detail \u2014 comments, dependencies, assignees'),
      ...img('14_quick_add_task', 'Figure 5.8 \u2014 Quick Add Task input'),
      ...img('15_task_filters_bar', 'Figure 5.9 \u2014 Task Filters bar'),
      ...img('16_bulk_actions_toolbar', 'Figure 5.10 \u2014 Bulk Actions toolbar (3 tasks selected)'),
      new Paragraph({ children: [new PageBreak()] }),

      // ── Screenshots: Project Page ──
      heading2('5.6 Project Page Views'),
      ...img('17_project_page_list', 'Figure 5.11 \u2014 Project Page \u2014 List View'),
      ...img('18_project_board_view', 'Figure 5.12 \u2014 Project Page \u2014 Kanban Board'),
      ...img('19_project_calendar_view', 'Figure 5.13 \u2014 Project Page \u2014 Calendar'),
      ...img('20_project_gantt_view', 'Figure 5.14 \u2014 Project Page \u2014 Gantt Chart'),
      new Paragraph({ children: [new PageBreak()] }),

      // ── Screenshots: Team, Chat, Notifications, Search ──
      heading2('5.7 Team, Chat & Other Features'),
      ...img('21_team_dashboard', 'Figure 5.15 \u2014 Team Dashboard'),
      ...img('22_chat_panel', 'Figure 5.16 \u2014 Chat Panel (slide-in)'),
      ...img('23_chat_conversation', 'Figure 5.17 \u2014 Chat \u2014 conversation thread'),
      ...img('24_notifications_dropdown', 'Figure 5.18 \u2014 Notifications dropdown'),
      ...img('25_command_palette', 'Figure 5.19 \u2014 Command Palette (Ctrl+K)'),
      ...img('26_keyboard_shortcuts', 'Figure 5.20 \u2014 Keyboard Shortcuts help modal'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 6: STATE MANAGEMENT ══════════
      heading1('6. State Management (Zustand)'),
      para('The app uses 6 Zustand stores. Each store manages its own Supabase queries and real-time subscriptions.'),
      emptyLine(),

      heading2('6.1 authStore'),
      paraMulti({ text: 'State: ', bold: true }, 'user, profile, session, loading, initialized'),
      paraMulti({ text: 'Key Actions: ', bold: true }, 'initialize(), signIn(), signUp(), signOut(), updateProfile(), fetchProfile()'),
      paraMulti({ text: 'Tables: ', bold: true }, 'profiles'),
      paraMulti({ text: 'Realtime: ', bold: true }, 'onAuthStateChange listener'),
      emptyLine(),

      heading2('6.2 teamStore'),
      paraMulti({ text: 'State: ', bold: true }, 'teams, currentTeam, members, subTeams, loading'),
      paraMulti({ text: 'Key Actions: ', bold: true }, 'fetchTeams(), selectTeam(), createTeam(), inviteMember(), removeMember() (with task unassign), updateMemberRole() (with last-admin protection), sub-team CRUD'),
      paraMulti({ text: 'Tables: ', bold: true }, 'teams, team_members, sub_teams, sub_team_members, profiles, projects, task_assignees'),
      emptyLine(),

      heading2('6.3 projectStore'),
      paraMulti({ text: 'State: ', bold: true }, 'projects, currentProject, loading'),
      paraMulti({ text: 'Key Actions: ', bold: true }, 'fetchProjects(), createProject(), updateProject(), deleteProject() (blocks default), getProjectStatus()'),
      paraMulti({ text: 'Tables: ', bold: true }, 'projects, tasks'),
      emptyLine(),

      heading2('6.4 taskStore'),
      paraMulti({ text: 'State: ', bold: true }, 'tasks, currentTask, comments, filters (persisted to localStorage), loading'),
      paraMulti({ text: 'Key Actions: ', bold: true }, 'fetchTasks(), fetchMyTasks(), fetchTeamTasks(), createTask(), updateTask() (optimistic + conflict detection via updated_at), deleteTask() (soft delete), restoreTask(), duplicateTask(), moveTask() (Kanban drag), dependency CRUD (with BFS cycle detection), comments CRUD'),
      paraMulti({ text: 'Tables: ', bold: true }, 'tasks, projects, task_assignees, task_dependencies, comments, profiles'),
      emptyLine(),

      heading2('6.5 chatStore'),
      paraMulti({ text: 'State: ', bold: true }, 'conversations, currentConversation, messages, loading'),
      paraMulti({ text: 'Key Actions: ', bold: true }, 'fetchConversations() (with unread count), selectConversation(), createDirectConversation(), createGroupConversation(), sendMessage(), markRead()'),
      paraMulti({ text: 'Realtime: ', bold: true }, 'postgres_changes subscription on messages table per conversation'),
      paraMulti({ text: 'Tables: ', bold: true }, 'conversations, conversation_members, messages, message_reads, profiles'),
      emptyLine(),

      heading2('6.6 notificationStore'),
      paraMulti({ text: 'State: ', bold: true }, 'notifications, unreadCount, loading'),
      paraMulti({ text: 'Key Actions: ', bold: true }, 'fetchNotifications() (limit 50), markRead(), markAllRead()'),
      paraMulti({ text: 'Realtime: ', bold: true }, 'postgres_changes subscription on notifications table'),
      paraMulti({ text: 'Tables: ', bold: true }, 'notifications'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 7: PERMISSIONS ══════════
      heading1('7. Permission Matrix (RBAC)'),
      para('Permissions are enforced at two levels: database (RLS policies check team membership) and UI (usePermissions hook gates interactive elements). Admins can customize any member\'s permissions individually.'),
      emptyLine(),
      heading2('7.1 Role Default Permissions'),
      simpleTable(['Permission', 'Admin', 'Sub-Team Mgr', 'Member', 'Viewer'], [
        ['view_tasks', '\u2713', '\u2713', '\u2713', '\u2713'],
        ['create_tasks', '\u2713', '\u2713', '\u2713', '\u2717'],
        ['edit_own_tasks', '\u2713', '\u2713', '\u2713', '\u2717'],
        ['edit_all_tasks', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['delete_tasks', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['manage_projects', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['manage_sub_teams', '\u2713', '\u2713', '\u2717', '\u2717'],
        ['invite_members', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['remove_members', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['manage_roles', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['view_admin_panel', '\u2713', '\u2717', '\u2717', '\u2717'],
        ['full_access', '\u2713', '\u2717', '\u2717', '\u2717'],
      ], [2400, 1200, 1800, 1200, 1240]),
      emptyLine(),
      para('Note: Permissions are stored per-member as jsonb in team_members.permissions. Admins can toggle any of the 12 permissions for any member, regardless of their role. The role column is a convenience label; actual access is determined by the permissions object.', { italics: true, color: COLOR_GRAY }),
      emptyLine(),
      heading2('7.2 UI Enforcement'),
      // ── Screenshots: Admin Panel ──
      heading2('7.4 Admin Panel Screenshots'),
      ...img('27_admin_members', 'Figure 7.1 \u2014 Admin Panel \u2014 Members tab'),
      ...img('28_admin_permissions_expanded', 'Figure 7.2 \u2014 Admin Panel \u2014 Permissions expanded'),
      ...img('29_admin_subteams', 'Figure 7.3 \u2014 Admin Panel \u2014 Sub-Teams tab'),
      ...img('30_admin_settings', 'Figure 7.4 \u2014 Admin Panel \u2014 Settings tab'),
      emptyLine(),

      // ── Screenshots: RBAC comparison ──
      heading2('7.5 Role Comparison (Admin vs Member)'),
      ...img('46_member_dashboard', 'Figure 7.5 \u2014 Member (Alice) Dashboard \u2014 no admin panel link'),
      ...img('47_member_task_detail', 'Figure 7.6 \u2014 Member Task Detail \u2014 restricted actions'),
      emptyLine(),

      simpleTable(['Component', 'Permission Check'], [
        ['TaskDetail', 'canEditTask() gates edit fields, delete/duplicate buttons'],
        ['BulkActions', "can('delete_tasks') gates bulk delete button"],
        ['QuickAddTask', "can('create_tasks') \u2014 component hidden entirely for viewers"],
        ['AssigneeSelector', 'readOnly prop when user cannot edit the task'],
        ['AdminPage / Sidebar', "isAdmin gates admin panel link and page access"],
      ], [3000, CW - 3000]),
      emptyLine(),
      heading2('7.3 usePermissions Hook API'),
      code('const { permissions, currentMember, isAdmin, can, canEditTask } = usePermissions()'),
      emptyLine(),
      simpleTable(['Method', 'Returns', 'Logic'], [
        ['permissions', 'TeamPermissions', 'Raw jsonb from team_members (or DEFAULT_PERMISSIONS)'],
        ['currentMember', 'TeamMember', 'Current user\'s team_members record'],
        ['isAdmin', 'boolean', 'role === "admin" OR full_access === true'],
        ['can(perm)', 'boolean', 'isAdmin OR permissions[perm] === true'],
        ['canEditTask(creatorId?)', 'boolean', 'isAdmin OR edit_all_tasks OR (edit_own_tasks AND creator is self)'],
      ], [2600, 2000, CW - 4600]),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 8: ROUTING ══════════
      heading1('8. Routing'),
      para('Uses react-router-dom v7 with createBrowserRouter. All protected routes are children of ProtectedRoute > AppLayout.'),
      emptyLine(),
      simpleTable(['Path', 'Page Component', 'Protected', 'Description'], [
        ['/login', 'LoginPage', 'No', 'Login + Signup forms (toggled internally)'],
        ['/', 'DashboardPage', 'Yes', 'My Tasks \u2014 all tasks assigned to current user'],
        ['/team', 'TeamDashboardPage', 'Yes', 'Team overview with member workload stats'],
        ['/projects/:id', 'ProjectPage', 'Yes', 'Project tasks with all 4 views'],
        ['/admin', 'AdminPage', 'Yes', 'Team admin: members, sub-teams, settings'],
        ['/profile', 'ProfilePage', 'Yes', 'User profile, theme, notification prefs'],
        ['/trash', 'TrashPage', 'Yes', 'Soft-deleted tasks with restore/permanent delete'],
      ], [2000, 2200, 1200, CW - 5400]),
      emptyLine(),
      para('SPA routing: Vercel rewrites all paths to index.html via vercel.json. ProtectedRoute redirects to /login if no authenticated session.'),
      new Paragraph({ children: [new PageBreak()] }),

      // ── Screenshots: Profile & Trash ──
      heading2('8.2 Profile & Trash Pages'),
      ...img('31_profile_page', 'Figure 8.1 \u2014 Profile Page'),
      ...img('32_profile_notifications', 'Figure 8.2 \u2014 Profile \u2014 Notification Preferences'),
      ...img('33_trash_page', 'Figure 8.3 \u2014 Trash Page'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 9: DESIGN SYSTEM ══════════
      heading1('9. Design System'),
      para('The app follows a Notion-like minimalist design: clean whitespace, subtle borders, neutral palette, calm UI.'),
      emptyLine(),

      heading2('9.1 Color Palette'),
      heading3('Primary (Indigo)'),
      simpleTable(['Token', 'Hex', 'Usage'], [
        ['primary-50', '#EEF2FF', 'Selected row backgrounds'],
        ['primary-100', '#E0E7FF', 'Hover states, light accents'],
        ['primary-200', '#C7D2FE', 'Focus rings'],
        ['primary-300', '#A5B4FC', 'Active indicators'],
        ['primary-400', '#818CF8', 'Secondary buttons'],
        ['primary-500', '#6366F1', 'Primary text links'],
        ['primary-600', '#4F46E5', 'Primary buttons, badges, active nav'],
        ['primary-700', '#4338CA', 'Button hover states'],
        ['primary-800', '#3730A3', 'Dark accents'],
        ['primary-900', '#312E81', 'Dark mode primary backgrounds'],
      ], [2000, 1800, CW - 3800]),
      emptyLine(),
      heading3('Semantic Colors'),
      simpleTable(['Color', 'Usage'], [
        ['Gray (50\u2013950)', 'Backgrounds, borders, text, inputs, disabled states'],
        ['Red', 'Danger buttons, errors, urgent priority (P1), delete actions'],
        ['Green', 'Success toasts, done status badge, completed checkmarks'],
        ['Blue', 'In-progress status badge'],
        ['Amber', 'On-hold status badge'],
        ['Orange', 'High priority dot (P2)'],
        ['Yellow', 'Medium priority dot (P3)'],
      ], [2400, CW - 2400]),
      emptyLine(),

      heading2('9.2 Typography'),
      paraMulti({ text: 'Font Family: ', bold: true }, 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'),
      paraMulti({ text: 'Base Size: ', bold: true }, '14px (text-sm in Tailwind)'),
      paraMulti({ text: 'Headings: ', bold: true }, '18\u201324px, font-semibold or font-bold'),
      paraMulti({ text: 'Labels: ', bold: true }, '10\u201312px, uppercase, tracking-wider, text-gray-500'),
      emptyLine(),

      heading2('9.3 Dark Mode'),
      para('Implemented via class-based dark mode: .dark class on <html> element. Three-state toggle: Light, Dark, System (follows OS preference). Stored in localStorage.'),
      emptyLine(),

      heading2('9.4 Responsive Breakpoints'),
      simpleTable(['Breakpoint', 'Width', 'Usage'], [
        ['sm', '640px', 'Search bar padding, minor layout adjustments'],
        ['md', '768px', 'Tablet adaptations'],
        ['lg', '1024px', 'Primary: sidebar visible, bottom nav hidden'],
        ['xl', '1280px', 'Wide desktop layout'],
        ['2xl', '1536px', 'Ultra-wide max-width constraints'],
      ], [1600, 1600, CW - 3200]),
      emptyLine(),

      heading2('9.5 Status & Priority Indicators'),
      simpleTable(['Status', 'Badge Color', 'Priority', 'Dot Color'], [
        ['todo', 'Gray', '1 (Urgent)', 'Red'],
        ['in_progress', 'Blue', '2 (High)', 'Orange'],
        ['on_hold', 'Amber', '3 (Medium)', 'Yellow'],
        ['done', 'Green', '4 (Low)', 'Gray'],
      ], [2000, 2100, 2500, CW - 6600]),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 10: COMPONENTS ══════════
      heading1('10. Component Inventory'),
      para('All components are in src/components/, organized by feature folder.'),
      emptyLine(),

      heading2('10.1 auth/'),
      simpleTable(['Component', 'Description'], [
        ['LoginForm', 'Email/password login with client-side validation and inline errors'],
        ['SignupForm', 'Registration with full_name, email, password, confirm password validation'],
        ['ProtectedRoute', 'Route guard \u2014 redirects to /login if no authenticated user'],
      ], [2800, CW - 2800]),
      emptyLine(),

      heading2('10.2 layout/'),
      simpleTable(['Component', 'Description'], [
        ['AppLayout', 'Root layout: sidebar (desktop), mobile overlay, header, bottom nav, chat, search, shortcuts'],
        ['Header', 'Top bar: hamburger (mobile), search (desktop), theme toggle, notifications, chat toggle'],
        ['Sidebar', '264px left panel: team switcher, nav links, projects (collapsible at 5), admin, trash, user footer'],
        ['BottomNav', 'Fixed bottom nav for mobile (<lg): Tasks, Team, Search, Chat, Alerts'],
      ], [2800, CW - 2800]),
      emptyLine(),

      heading2('10.3 tasks/'),
      simpleTable(['Component', 'Description'], [
        ['TaskList', 'Table/list view with status-grouped rows, collapsible groups, subtask nesting'],
        ['TaskRow', 'Single row: checkbox, expand/collapse, priority dot, status toggle, title, badges, avatars'],
        ['TaskBoard', 'Kanban board: 4 columns (todo, in_progress, on_hold, done), drag-drop via @dnd-kit'],
        ['TaskCalendar', 'FullCalendar month view: tasks as events, click-to-select, date-click for creation'],
        ['TaskGantt', 'Horizontal timeline: task bars with dependency arrows, priority-colored, date labels'],
        ['TaskDetail', 'Slide-in panel: editable title/description/status/priority/dates, assignees, deps, comments, RBAC-gated'],
        ['TaskCard', 'Kanban card: title, priority dot, due date, assignee avatars'],
        ['TaskFilters', 'Filter bar: search, status, priority, assignee, sort, responsibility, clear'],
        ['QuickAddTask', 'Inline single-line task input with optional status grouping, hidden for viewers'],
        ['BulkActions', 'Floating bar: bulk status/priority/assignee/date changes, bulk delete'],
        ['AssigneeSelector', 'Dropdown to add/remove/change role of task assignees from team members'],
        ['DependencySelector', 'Dropdown to add/remove dependencies with cycle detection'],
        ['RecurrenceSelector', 'Recurrence UI: daily/weekly/monthly/custom, interval, day selection'],
        ['CommentList', 'Thread of comments with add/delete and avatar display'],
        ['TaskTemplates', 'Save/load task templates (localStorage), create tasks from templates'],
        ['ViewToggle', 'Toggle buttons for list, board, calendar, gantt views'],
      ], [2800, CW - 2800]),
      emptyLine(),

      heading2('10.4 Other Features'),
      simpleTable(['Folder', 'Component', 'Description'], [
        ['chat/', 'ChatPanel', 'Slide-in right panel: conversation list, messages, send input, new DM/group modal'],
        ['notifications/', 'NotificationDropdown', 'Bell icon with unread badge, dropdown list, mark-read, click-to-navigate'],
        ['search/', 'GlobalSearch', 'Command palette (Ctrl+K): debounced search, quick actions, keyboard navigation'],
        ['onboarding/', 'WelcomeGuide', '3-step checklist (join team, create project, add task), dismissible'],
        ['project/', 'CreateProjectModal', 'Modal: emoji picker, name, description, start/end dates'],
        ['team/', 'TeamSwitcher', 'Sidebar dropdown to switch teams or create a new one'],
        ['team/', 'InviteModal', 'Modal to invite member by email address'],
        ['team/', 'CreateTeamModal', 'Modal for creating a new team with name and description'],
      ], [2000, 2600, CW - 4600]),
      emptyLine(),

      heading2('10.5 ui/ (Shared Components)'),
      simpleTable(['Component', 'Description'], [
        ['Avatar', 'Circle with initials or image (sm: h-6, md: h-8, lg: h-10)'],
        ['Badge', 'Inline rounded-full badge with custom className'],
        ['Button', '4 variants: primary, secondary, ghost, danger. 3 sizes: sm, md, lg'],
        ['ErrorBoundary', 'React class component error boundary with retry button'],
        ['Input', 'Styled text input with optional label and error message'],
        ['Modal', 'Centered overlay modal with close button (sm, md, lg, xl sizes)'],
        ['ProgressBar', 'Horizontal progress bar with clamped 0\u2013100 value'],
        ['Select', 'Styled select dropdown with label and options'],
        ['Skeleton', 'Animated pulse placeholder for loading states'],
        ['Toast', 'Toast system with context provider, auto-dismiss (success/error/info)'],
        ['KeyboardShortcutsHelp', 'Modal showing shortcut reference (n, Ctrl+K, /, 1\u20134, ?, Esc)'],
      ], [2800, CW - 2800]),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 11: DEPLOYMENT ══════════
      heading1('11. Deployment'),
      heading2('11.1 Vercel Configuration'),
      para('The frontend is hosted on Vercel with auto-deploy from the main branch.'),
      emptyLine(),
      paraMulti({ text: 'Build command: ', bold: true }, 'tsc -b && vite build'),
      paraMulti({ text: 'Output directory: ', bold: true }, 'dist/'),
      paraMulti({ text: 'SPA routing: ', bold: true }, 'All paths rewrite to /index.html via vercel.json'),
      paraMulti({ text: 'Manual deploy: ', bold: true }, 'npx vercel --prod'),
      emptyLine(),

      heading2('11.2 Environment Variables'),
      simpleTable(['Variable', 'Description', 'Where'], [
        ['VITE_SUPABASE_URL', 'Supabase project URL', 'Vercel env + local .env'],
        ['VITE_SUPABASE_ANON_KEY', 'Supabase anon/public API key (safe to expose)', 'Vercel env + local .env'],
      ], [3000, 3800, CW - 6800]),
      emptyLine(),
      para('These are public-facing keys protected by RLS. They do not grant admin access to the database.', { italics: true, color: COLOR_GRAY }),
      emptyLine(),

      heading2('11.3 Production URL'),
      para('https://task-manager-eight-vert-91.vercel.app'),
      emptyLine(),

      heading2('11.4 CI/CD'),
      para('No CI pipeline is configured. Deployment is either via Vercel auto-deploy on push to main, or manual via npx vercel --prod. Branch protection on main requires PRs with 1 approval.'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 12: DARK MODE ══════════
      heading1('12. Dark Mode'),
      para('The app supports full dark mode across all components. Toggle via the sun/moon icon in the header or from the Profile page.'),
      emptyLine(),
      ...img('35_dark_dashboard_list', 'Figure 12.1 \u2014 Dark Mode \u2014 Dashboard List View'),
      ...img('36_dark_board_view', 'Figure 12.2 \u2014 Dark Mode \u2014 Kanban Board'),
      ...img('37_dark_task_detail', 'Figure 12.3 \u2014 Dark Mode \u2014 Task Detail'),
      ...img('38_dark_chat_panel', 'Figure 12.4 \u2014 Dark Mode \u2014 Chat Panel'),
      ...img('39_dark_admin_panel', 'Figure 12.5 \u2014 Dark Mode \u2014 Admin Panel'),
      ...img('40_dark_profile', 'Figure 12.6 \u2014 Dark Mode \u2014 Profile Page'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 13: MOBILE RESPONSIVE ══════════
      heading1('13. Mobile Responsive'),
      para('The app is fully responsive with a bottom navigation bar for mobile devices (< 1024px). The sidebar becomes an overlay.'),
      emptyLine(),
      ...img('41_mobile_login', 'Figure 13.1 \u2014 Mobile \u2014 Login Page', 300, 650),
      ...img('42_mobile_dashboard', 'Figure 13.2 \u2014 Mobile \u2014 Dashboard with Bottom Nav', 300, 650),
      ...img('45_mobile_bottom_nav', 'Figure 13.3 \u2014 Mobile \u2014 Bottom Navigation Bar', 300, 650),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 14: TEST ACCOUNTS ══════════
      heading1('14. Test Accounts'),
      para('These accounts are configured on the production Supabase instance for testing purposes.'),
      emptyLine(),
      simpleTable(['Role', 'Email', 'Password'], [
        ['Admin', 'uat.tester@test.com', 'UatTest123!'],
        ['Member (Alice)', 'alice.chat@test.com', 'ChatTest123!'],
        ['Member (Bob)', 'bob.chat@test.com', 'ChatTest123!'],
        ['Member (Carol)', 'carol.chat@test.com', 'ChatTest123!'],
      ], [2400, 3800, CW - 6200]),
      emptyLine(),
      paraMulti({ text: 'Team ID: ', bold: true }, '3de9df38-7861-46a7-8a28-791adfa0f581'),
      emptyLine(),
      para('Important: These accounts use the shared production Supabase backend. Collaborators should create their own Supabase project and test accounts for development. See CONTRIBUTING.md for setup instructions.', { italics: true, color: COLOR_GRAY }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ CHAPTER 15: CHANGE LOG ══════════
      heading1('15. Change Log'),
      emptyLine(),

      heading2('March 2026 \u2014 Initial Build'),
      para('Core features: authentication, teams, projects, tasks (4 views), real-time chat, notifications, dark mode, mobile responsive.'),
      emptyLine(),

      heading2('March 2026 \u2014 Comprehensive Review'),
      para('27 issues identified and fixed across 4 waves:'),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Wave 1 (Bugs): Auth listener leak, chat N+1, subscription cleanup, error boundaries, profiles RLS, date validation, filter persistence, optimistic updates + conflict detection', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Wave 2 (Half-built): Notification triggers (DB), dependencies UI + Gantt arrows, recurring tasks UI, keyboard shortcuts', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Wave 3 (UX): Onboarding guide, mobile bottom nav, command palette (Ctrl+K), bulk operations, task templates', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Wave 4 (Polish): WCAG AA contrast, keyboard nav (Kanban), ARIA labels, loading skeletons', font: FONT, size: 21 })] }),
      emptyLine(),

      heading2('March 2026 \u2014 Post-Review Fixes'),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Panel overlap: Chat closes Task Detail and vice versa', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Sort options: position, due date, priority, title, created', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Dependency cycle detection via BFS graph walk', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Last admin protection: blocks removing/demoting last admin', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Member removal cleanup: auto-unassigns from all tasks', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Calendar click-to-create task on date', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Trash auto-purge: pg_cron job for 30-day cleanup', font: FONT, size: 21 })] }),
      emptyLine(),

      heading2('April 2026 \u2014 UAT & Final Fixes'),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'BUG-001: Sign-out reliability \u2014 try/catch/finally + force redirect', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'BUG-002: Login error feedback \u2014 inline error banner', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'BUG-003: Custom form validation \u2014 noValidate + React state-based per-field errors', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'BUG-004: RBAC UI enforcement \u2014 usePermissions hook across 4 components', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Accessibility audit: axe-core \u2014 ARIA labels, color contrast (gray-400\u2192500), <main> landmark', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'UAT Report: 97/97 tests passing (100% pass rate)', font: FONT, size: 21 })] }),
      emptyLine(),
      emptyLine(),

      // ══════════ END OF PART A ══════════
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY, space: 1 } }, spacing: { before: 400, after: 200 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'End of Part A: Technical Reference', font: FONT, size: 24, bold: true, color: COLOR_PRIMARY })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════
      //  PART B: UI/UX REVIEW GUIDE
      // ══════════════════════════════════════════════════════
      new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Part B', font: FONT, size: 48, bold: true, color: COLOR_PRIMARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'UI/UX Review Guide', font: FONT, size: 36, color: COLOR_GRAY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'For reviewers evaluating usability, design, and user experience', font: FONT, size: 22, italics: true, color: '9CA3AF' })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ B1: SCREEN-BY-SCREEN WALKTHROUGH ══════════
      heading1('B1. Screen-by-Screen Walkthrough'),
      para('This section walks through every screen in the app with screenshots and plain-language descriptions of what each screen does and why it exists.'),
      emptyLine(),

      heading2('B1.1 Login Page'),
      para('This is the first screen users see. It has two forms that toggle between each other: Login and Sign Up.'),
      ...img('01_login_empty', 'Login page \u2014 clean, centered form with email and password fields'),
      para('What\u2019s here: Email field, password field, "Log In" button, and a "Sign up" link at the bottom to switch to registration.'),
      emptyLine(),
      para('If a user submits the form with missing or invalid fields, inline error messages appear under each field:'),
      ...img('02_login_validation_errors', 'Validation errors shown per field \u2014 no browser popups'),
      emptyLine(),
      para('If the email/password combination is wrong, an error banner appears at the top of the form:'),
      ...img('03_login_invalid_credentials', 'Server error \u2014 "Invalid email or password" banner'),
      emptyLine(),

      heading2('B1.2 Sign Up Page'),
      para('New users create an account here. Fields: full name, email, password, confirm password.'),
      ...img('04_signup_form', 'Sign-up form \u2014 same minimalist style as login'),
      ...img('05_signup_validation_errors', 'Sign-up validation \u2014 all fields validated with specific messages'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.3 Dashboard (My Tasks)'),
      para('The main landing page after login. Shows all tasks assigned to the current user across every project. This is the personal task hub.'),
      emptyLine(),
      para('What you see:'),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Sidebar (left) \u2014 navigation, projects, team tools', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Header (top) \u2014 search, theme toggle, notifications bell, chat toggle', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'View tabs \u2014 List, Board, Calendar, Gantt', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Filter bar \u2014 search, status, priority, sort', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Quick-add bar \u2014 type a task name and press Enter', font: FONT, size: 21 })] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'Task list \u2014 grouped by status (To Do, In Progress, On Hold, Done)', font: FONT, size: 21 })] }),
      ...img('06_dashboard_list_view', 'Dashboard \u2014 List View (default landing page)'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.4 The Four Task Views'),
      para('Users can switch between 4 ways of looking at their tasks. Each view shows the same data differently.'),
      emptyLine(),
      heading3('List View'),
      para('Default view. Tasks in rows grouped by status. Each row shows priority dot, title, status badge, assignee avatars, due date, and sub-task count. Checkboxes on the left for bulk selection.'),
      ...img('06_dashboard_list_view', 'List View \u2014 rows grouped by status'),
      emptyLine(),
      heading3('Board View (Kanban)'),
      para('Tasks as cards in 4 columns: To Do, In Progress, On Hold, Done. Drag a card between columns to change its status.'),
      ...img('07_dashboard_board_view', 'Board View \u2014 Kanban columns with drag-and-drop'),
      emptyLine(),
      heading3('Calendar View'),
      para('Monthly calendar showing tasks as colored bars based on priority. Click a task to open details. In project pages, click an empty date to create a task on that day.'),
      ...img('08_dashboard_calendar_view', 'Calendar View \u2014 tasks as colored bars by priority'),
      emptyLine(),
      heading3('Gantt View'),
      para('Horizontal timeline showing task durations as bars. Arrows between bars show dependencies. Red vertical line marks today. Great for seeing overlaps and scheduling conflicts.'),
      ...img('09_dashboard_gantt_view', 'Gantt View \u2014 timeline with dependency arrows'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.5 Task Detail Panel'),
      para('Clicking any task opens a slide-in panel on the right. This is where users edit everything about a task.'),
      ...img('11_task_detail_panel', 'Task Detail \u2014 slide-in panel with all editable fields'),
      emptyLine(),
      para('Editable fields: title, status, priority, start/end dates, description, assignees (primary/secondary), dependencies, recurrence, sub-tasks, and comments.'),
      emptyLine(),
      para('Scrolling down reveals comments, dependencies, and the sub-task creation area:'),
      ...img('12_task_detail_bottom', 'Task Detail \u2014 bottom section with comments and dependencies'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.6 Quick Add & Filters'),
      para('The Quick Add bar lets users create tasks instantly by typing a name and pressing Enter. No modal, no form \u2014 just type and go.'),
      ...img('14_quick_add_task', 'Quick Add \u2014 inline task creation'),
      emptyLine(),
      para('The filter bar narrows down visible tasks by keyword search, status, priority, assignee, and sort order:'),
      ...img('15_task_filters_bar', 'Filter bar \u2014 search, status, priority, sort dropdowns'),
      emptyLine(),

      heading2('B1.7 Bulk Actions'),
      para('Select multiple tasks with checkboxes, then a floating toolbar appears at the bottom with options: change status, priority, assignee, shift dates, or delete.'),
      ...img('16_bulk_actions_toolbar', 'Bulk Actions \u2014 3 tasks selected, toolbar at bottom'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.8 Project Page'),
      para('Each project has its own page showing only that project\u2019s tasks. Same 4 views available. Shows project name, emoji, status badge, progress bar, and date range.'),
      ...img('17_project_page_list', 'Project Page \u2014 List View'),
      ...img('18_project_board_view', 'Project Page \u2014 Kanban Board'),
      ...img('19_project_calendar_view', 'Project Page \u2014 Calendar'),
      ...img('20_project_gantt_view', 'Project Page \u2014 Gantt Chart'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.9 Team Dashboard'),
      para('Bird\u2019s-eye view of all team work. Shows stat cards (Total Tasks, In Progress, Overdue, Done This Week) and all tasks across every project. Has an extra "Assignee" filter to see a specific person\u2019s workload.'),
      ...img('21_team_dashboard', 'Team Dashboard \u2014 team-wide task overview'),
      emptyLine(),

      heading2('B1.10 Chat'),
      para('Real-time messaging without leaving the app. Supports direct (1-on-1), team, and group conversations. Messages update live via WebSocket.'),
      ...img('22_chat_panel', 'Chat Panel \u2014 conversation list'),
      ...img('23_chat_conversation', 'Chat \u2014 message thread'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.11 Notifications'),
      para('Bell icon in the header shows a red badge with unread count. Dropdown lists recent notifications. Click to mark as read and navigate to the related task.'),
      para('Triggers: task assigned to you, someone comments on your task, task status changes.'),
      ...img('24_notifications_dropdown', 'Notifications dropdown \u2014 with unread badge'),
      emptyLine(),

      heading2('B1.12 Command Palette & Shortcuts'),
      para('Press Ctrl+K from anywhere to open a search/command palette. Search tasks by name, or use quick actions (new task, toggle theme, settings, trash).'),
      ...img('25_command_palette', 'Command Palette \u2014 Ctrl+K search and quick actions'),
      emptyLine(),
      para('Press ? to see all keyboard shortcuts:'),
      ...img('26_keyboard_shortcuts', 'Keyboard Shortcuts help modal'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.13 Admin Panel'),
      para('Only visible to admins. Three tabs: Members, Sub-Teams, Settings.'),
      emptyLine(),
      heading3('Members Tab'),
      para('Lists all team members. Admins can change roles, set custom permissions (12 toggles), or remove members.'),
      ...img('27_admin_members', 'Admin \u2014 Members tab'),
      ...img('28_admin_permissions_expanded', 'Admin \u2014 Permission toggles expanded for a member'),
      emptyLine(),
      heading3('Sub-Teams Tab'),
      para('Create smaller groups within the team (e.g., "Design Team"). Add/remove members via dropdown.'),
      ...img('29_admin_subteams', 'Admin \u2014 Sub-Teams tab'),
      emptyLine(),
      heading3('Settings Tab'),
      para('Change team name and description.'),
      ...img('30_admin_settings', 'Admin \u2014 Settings tab'),
      new Paragraph({ children: [new PageBreak()] }),

      heading2('B1.14 Profile & Settings'),
      para('Users can edit their name, change the theme (Light/Dark/System), and configure notification preferences with quiet hours.'),
      ...img('31_profile_page', 'Profile Page \u2014 name, theme, and settings'),
      ...img('32_profile_notifications', 'Notification Preferences \u2014 toggle types and quiet hours'),
      emptyLine(),

      heading2('B1.15 Trash'),
      para('Deleted tasks go here first. Users can restore them or permanently delete. Tasks auto-purge after 30 days.'),
      ...img('33_trash_page', 'Trash Page \u2014 soft-deleted tasks with restore/delete'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ B2: DARK MODE ══════════
      heading1('B2. Dark Mode \u2014 All Screens'),
      para('Every screen supports dark mode. Users toggle via the sun/moon icon in the header or from Profile settings. Three options: Light, Dark, System (follows OS).'),
      emptyLine(),
      ...img('35_dark_dashboard_list', 'Dark Mode \u2014 Dashboard List View'),
      ...img('36_dark_board_view', 'Dark Mode \u2014 Kanban Board'),
      ...img('37_dark_task_detail', 'Dark Mode \u2014 Task Detail Panel'),
      ...img('38_dark_chat_panel', 'Dark Mode \u2014 Chat Panel'),
      ...img('39_dark_admin_panel', 'Dark Mode \u2014 Admin Panel'),
      ...img('40_dark_profile', 'Dark Mode \u2014 Profile Page'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ B3: MOBILE ══════════
      heading1('B3. Mobile Responsive'),
      para('The app adapts to mobile screens (<1024px). The sidebar becomes an overlay toggled by a hamburger icon. A fixed bottom navigation bar provides quick access to Tasks, Team, Search, Chat, and Alerts.'),
      emptyLine(),
      ...img('41_mobile_login', 'Mobile \u2014 Login Page', 300, 650),
      ...img('42_mobile_dashboard', 'Mobile \u2014 Dashboard with Bottom Navigation', 300, 650),
      ...img('45_mobile_bottom_nav', 'Mobile \u2014 Bottom Navigation Bar', 300, 650),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ B4: ROLE COMPARISON ══════════
      heading1('B4. Role-Based Access (What Users See)'),
      para('The app enforces permissions in the UI. Different roles see different things. Here\u2019s a comparison:'),
      emptyLine(),
      heading2('B4.1 Admin View'),
      para('Admins see everything: all tasks, admin panel link in sidebar, delete/edit buttons on all tasks, full bulk actions toolbar.'),
      ...img('06_dashboard_list_view', 'Admin Dashboard \u2014 full sidebar with Admin Panel link'),
      emptyLine(),
      heading2('B4.2 Member View'),
      para('Members don\u2019t see the Admin Panel link. They can create and edit their own tasks. They cannot delete tasks or manage team settings.'),
      ...img('46_member_dashboard', 'Member (Alice) Dashboard \u2014 no Admin Panel link in sidebar'),
      ...img('47_member_task_detail', 'Member Task Detail \u2014 edit/delete buttons may be restricted'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════ B5: REVIEW CHECKLIST ══════════
      heading1('B5. Review Checklist'),
      para('Use this checklist to systematically test the app. Open the app in your browser, try each workflow, and note any issues as comments on this document.'),
      emptyLine(),
      para('App URL: https://task-manager-eight-vert-91.vercel.app'),
      para('Login: uat.tester@test.com / UatTest123!'),
      emptyLine(),

      heading2('B5.1 Account & Authentication'),
      simpleTable(['#', 'Test', 'Result'], [
        ['1', 'Open the app \u2014 does the login page load cleanly?', ''],
        ['2', 'Try logging in with wrong password \u2014 does it show a clear error?', ''],
        ['3', 'Log in with the test account \u2014 does it redirect to the dashboard?', ''],
        ['4', 'Click Sign Out \u2014 does it log you out and show the login page?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      heading2('B5.2 Navigation & Layout'),
      simpleTable(['#', 'Test', 'Result'], [
        ['5', 'Is the sidebar easy to understand? Can you find projects, team dashboard, admin?', ''],
        ['6', 'Click through all sidebar links \u2014 do they all work?', ''],
        ['7', 'Switch between List, Board, Calendar, Gantt views \u2014 are they all useful?', ''],
        ['8', 'Press Ctrl+K \u2014 does the search palette open? Can you find tasks?', ''],
        ['9', 'Press ? \u2014 do the keyboard shortcuts make sense?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      heading2('B5.3 Task Management'),
      simpleTable(['#', 'Test', 'Result'], [
        ['10', 'Create a task using Quick Add \u2014 is it intuitive?', ''],
        ['11', 'Click a task to open the detail panel \u2014 can you edit all fields?', ''],
        ['12', 'Change status by clicking the circle checkbox in the list \u2014 does it work?', ''],
        ['13', 'Drag a card in Board view to change its status \u2014 is it smooth?', ''],
        ['14', 'Add a sub-task \u2014 does it appear nested under the parent?', ''],
        ['15', 'Add a dependency \u2014 does the Gantt view show the arrow?', ''],
        ['16', 'Add a comment on a task \u2014 does it appear instantly?', ''],
        ['17', 'Delete a task \u2014 does it go to Trash? Can you restore it?', ''],
        ['18', 'Select multiple tasks and use bulk actions \u2014 does it work?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      heading2('B5.4 Team & Chat'),
      simpleTable(['#', 'Test', 'Result'], [
        ['19', 'Open Team Dashboard \u2014 does it show useful stats?', ''],
        ['20', 'Open Chat \u2014 can you see conversations and send a message?', ''],
        ['21', 'Click the bell icon \u2014 do notifications appear? Are they relevant?', ''],
        ['22', 'Open Admin Panel \u2014 can you see members, change roles, manage sub-teams?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      heading2('B5.5 Settings & Personalization'),
      simpleTable(['#', 'Test', 'Result'], [
        ['23', 'Go to Profile \u2014 can you change your name and save?', ''],
        ['24', 'Switch to Dark Mode \u2014 does the entire app look good?', ''],
        ['25', 'Switch back to Light Mode \u2014 does it revert cleanly?', ''],
        ['26', 'Set notification preferences \u2014 are the options clear?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      heading2('B5.6 Mobile Experience'),
      simpleTable(['#', 'Test', 'Result'], [
        ['27', 'Open the app on your phone \u2014 does it load properly?', ''],
        ['28', 'Is the bottom navigation bar easy to use?', ''],
        ['29', 'Can you open the sidebar with the hamburger menu?', ''],
        ['30', 'Can you create and edit tasks on mobile?', ''],
        ['31', 'Does Board view scroll horizontally on mobile?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      heading2('B5.7 Overall Impression'),
      simpleTable(['#', 'Question', 'Notes'], [
        ['32', 'Is the app easy to learn without instructions?', ''],
        ['33', 'What\u2019s the most confusing part?', ''],
        ['34', 'What\u2019s missing that you\u2019d expect in a task manager?', ''],
        ['35', 'Would you use this over your current tool? Why/why not?', ''],
        ['36', 'Rate the overall design: 1 (ugly) to 5 (beautiful)', ''],
        ['37', 'Rate the usability: 1 (confusing) to 5 (intuitive)', ''],
        ['38', 'Any other comments, suggestions, or bugs noticed?', ''],
      ], [600, 7000, CW - 7600]),
      emptyLine(),

      // ══════════ END ══════════
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY, space: 1 } }, spacing: { before: 400, after: 200 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'End of Document', font: FONT, size: 24, bold: true, color: COLOR_PRIMARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Please add your review comments directly in this document using Track Changes or Comments.', font: FONT, size: 20, color: COLOR_GRAY })] }),
    ],
  }],
});

const outPath1 = 'D:\\Coding\\task-manager\\Team-Task-Manager-Technical-Reference.docx';
const outPath2 = 'D:\\Coding\\task-manager\\Team-Task-Manager-Technical-Reference-v2.docx';
Packer.toBuffer(doc).then(buf => {
  let outPath;
  try { fs.writeFileSync(outPath1, buf); outPath = outPath1; }
  catch { fs.writeFileSync(outPath2, buf); outPath = outPath2; console.log('Original file locked, wrote to v2 instead.'); }
  console.log(`Technical Reference saved: ${outPath}`);
  console.log(`File size: ${(buf.length / 1024).toFixed(0)} KB`);
  console.log('Part A: 15 chapters (Technical Reference)');
  console.log('Part B: 5 sections (UI/UX Review Guide with 38-item checklist)');
});
