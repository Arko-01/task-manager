import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition
} from 'docx';
import fs from 'fs';

// ── Shared Constants ──────────────────────────────────────────────────
const FONT = 'Arial';
const COLOR_PRIMARY = '1B4F72';
const COLOR_ACCENT = '2E86C1';
const COLOR_HEADER_BG = 'D6EAF8';
const COLOR_ALT_ROW = 'F2F8FD';
const COLOR_PASS = '27AE60';
const COLOR_FAIL = 'E74C3C';
const COLOR_NA = '95A5A6';
const COLOR_BORDER = 'BDC3C7';

const border = { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

// Page: US Letter
const PAGE_WIDTH = 12240;
const MARGIN = 1080; // 0.75 inch
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// ── Helper Functions ──────────────────────────────────────────────────

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: COLOR_PRIMARY })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: COLOR_ACCENT })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: COLOR_PRIMARY })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 20, ...opts })]
  });
}

function boldPara(label, text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: label, font: FONT, size: 20, bold: true }),
      new TextRun({ text, font: FONT, size: 20 })
    ]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 20 })]
  });
}

function numberedItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 20 })]
  });
}

function stepItem(text, ref = 'steps') {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 20 })]
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// Table helpers
function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 18, bold: true, color: COLOR_PRIMARY })]
    })]
  });
}

function cell(text, width, opts = {}) {
  const { shading, bold, color } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 18, bold: !!bold, color })]
    })]
  });
}

function multiLineCell(lines, width, opts = {}) {
  const { shading } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: lines.map(l => new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: l, font: FONT, size: 18 })]
    }))
  });
}

// Test case table - standard 6 column
// Cols: TC ID | Test Scenario | Steps | Expected Result | Status | Remarks
const TC_COLS = [800, 2000, 3200, 2400, 700, 980];
// sum = 10080 => adjust to CONTENT_WIDTH = 10080
// CONTENT_WIDTH = 12240 - 2160 = 10080.

function tcHeaderRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      headerCell('TC ID', TC_COLS[0]),
      headerCell('Test Scenario', TC_COLS[1]),
      headerCell('Steps to Execute', TC_COLS[2]),
      headerCell('Expected Result', TC_COLS[3]),
      headerCell('Status', TC_COLS[4]),
      headerCell('Remarks', TC_COLS[5]),
    ]
  });
}

function tcRow(id, scenario, steps, expected, alt = false) {
  const bg = alt ? COLOR_ALT_ROW : undefined;
  return new TableRow({
    children: [
      cell(id, TC_COLS[0], { shading: bg, bold: true }),
      cell(scenario, TC_COLS[1], { shading: bg }),
      multiLineCell(steps, TC_COLS[2], { shading: bg }),
      multiLineCell(Array.isArray(expected) ? expected : [expected], TC_COLS[3], { shading: bg }),
      cell('', TC_COLS[4], { shading: bg }),
      cell('', TC_COLS[5], { shading: bg }),
    ]
  });
}

function tcTable(rows) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: TC_COLS,
    rows: [tcHeaderRow(), ...rows]
  });
}

// Section separator
function sectionDivider() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_ACCENT, space: 8 } },
    children: []
  });
}

// ── DOCUMENT CONTENT ──────────────────────────────────────────────────

const children = [];

// ════════════════════════════════════════════════════════════════
// COVER PAGE
// ════════════════════════════════════════════════════════════════
children.push(
  emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'TEAM TASK MANAGER', font: FONT, size: 52, bold: true, color: COLOR_PRIMARY })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'User Acceptance Testing (UAT) Manual', font: FONT, size: 36, color: COLOR_ACCENT })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: 'Comprehensive Test Plan & Execution Guide', font: FONT, size: 24, color: '666666' })]
  }),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_ACCENT, space: 12 }, bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_ACCENT, space: 12 } },
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: 'Version 1.0  |  March 2026', font: FONT, size: 22, color: '555555' })]
  }),
  emptyLine(), emptyLine(),
);

// Document info table
const infoColA = 2400;
const infoColB = 7680;
const infoRows = [
  ['Application', 'Team Task Manager'],
  ['Version', '1.0'],
  ['Production URL', 'https://task-manager-eight-vert-91.vercel.app'],
  ['GitHub Repository', 'https://github.com/Arko-01/task-manager'],
  ['Prepared By', 'QA Lead / UAT Team'],
  ['Date', 'March 30, 2026'],
  ['Document Status', 'Active'],
];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [infoColA, infoColB],
    rows: infoRows.map(([k, v], i) => new TableRow({
      children: [
        cell(k, infoColA, { shading: COLOR_HEADER_BG, bold: true }),
        cell(v, infoColB, { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
      ]
    }))
  }),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('Table of Contents'),
  emptyLine(),
);
const tocItems = [
  '1.  Introduction & Objectives',
  '2.  UAT Scope & Environment',
  '3.  Test Accounts & Access',
  '4.  Roles & Responsibilities',
  '5.  Entry & Exit Criteria',
  '6.  Defect Management',
  '7.  Test Execution: Authentication & Onboarding',
  '8.  Test Execution: Dashboard (My Tasks)',
  '9.  Test Execution: Projects',
  '10. Test Execution: Task Creation',
  '11. Test Execution: Task Views (List, Board, Calendar, Gantt)',
  '12. Test Execution: Task Details & Editing',
  '13. Test Execution: Filters & Sorting',
  '14. Test Execution: Bulk Actions',
  '15. Test Execution: Team Dashboard',
  '16. Test Execution: Chat & Real-Time Messaging',
  '17. Test Execution: Notifications',
  '18. Test Execution: Search & Keyboard Shortcuts',
  '19. Test Execution: Admin Panel',
  '20. Test Execution: Profile & Settings',
  '21. Test Execution: Trash & Recovery',
  '22. Test Execution: Role-Based Access Control (RBAC)',
  '23. Test Execution: Mobile & Responsive',
  '24. Test Execution: Error Handling & Edge Cases',
  '25. Test Execution: Performance & Real-Time',
  '26. UAT Sign-Off Sheet',
  'Appendix A: Defect Report Template',
  'Appendix B: Test Summary Report Template',
];
tocItems.forEach(item => children.push(para(item)));
children.push(pageBreak());

// ════════════════════════════════════════════════════════════════
// SECTION 1: INTRODUCTION
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('1. Introduction & Objectives'),
  sectionDivider(),
  heading2('1.1 Purpose'),
  para('This UAT Manual provides a comprehensive, step-by-step guide for performing User Acceptance Testing on the Team Task Manager application. It is designed to be used by the QA Lead, QA Engineers, Release Manager, Engineering Manager, and Product Manager to validate that all features meet business requirements and acceptance criteria before production release.'),
  heading2('1.2 Objectives'),
  bullet('Verify all user-facing features work correctly end-to-end'),
  bullet('Validate role-based access control (RBAC) with 4 role types and 12 permissions'),
  bullet('Confirm real-time features (chat, notifications) function across multiple users'),
  bullet('Ensure data integrity, security (RLS policies), and error handling'),
  bullet('Test responsive design across desktop and mobile viewports'),
  bullet('Validate accessibility (WCAG AA contrast, ARIA labels, keyboard navigation)'),
  bullet('Confirm all 4 task views (List, Board, Calendar, Gantt) render and interact correctly'),
  bullet('Test bulk operations, filters, sorting, and search functionality'),
  bullet('Verify trash/restore lifecycle and auto-purge behavior'),
  heading2('1.3 Application Overview'),
  para('Team Task Manager is a web-based task management tool built with React 19, TypeScript, Tailwind CSS, and Supabase. It provides teams with project organization, task tracking across 4 views, real-time chat, role-based permissions, and a Notion-like minimal UI.'),
  heading2('1.4 References'),
  bullet('User Manual: Team-Task-Manager-User-Manual.docx (Version 1.1)'),
  bullet('CLAUDE.md: Project technical documentation'),
  bullet('Database Migrations: supabase/migrations/001-007'),
  bullet('GitHub Repository: https://github.com/Arko-01/task-manager'),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 2: SCOPE & ENVIRONMENT
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('2. UAT Scope & Environment'),
  sectionDivider(),
  heading2('2.1 In Scope'),
  bullet('Authentication: Sign up, log in, log out, session persistence'),
  bullet('Team Management: Create team, invite members, remove members, role assignment'),
  bullet('Projects: CRUD operations, status tracking, progress bar, emoji picker'),
  bullet('Tasks: CRUD, sub-tasks (2 levels), dependencies, recurrence, templates, drag-and-drop'),
  bullet('4 Views: List, Board (Kanban), Calendar, Gantt with view-specific interactions'),
  bullet('Task Details: All editable fields, assignees (primary/secondary), comments, duplicate, delete'),
  bullet('Filters & Sorting: Search, status, priority, role, assignee filters; 5 sort options'),
  bullet('Bulk Actions: Status, priority, assign, shift dates, delete on multi-selected tasks'),
  bullet('Team Dashboard: Aggregated view with stat cards'),
  bullet('Chat: Direct, group conversations; real-time messaging; unread counts'),
  bullet('Notifications: DB-triggered (assignment, comment, status change); preferences; quiet hours'),
  bullet('Search: Global command palette (Ctrl+K); quick actions'),
  bullet('Admin Panel: Members tab, Sub-Teams tab, Settings tab, invite flow'),
  bullet('Profile: Name editing, theme (light/dark/system), notification preferences'),
  bullet('Trash: Soft delete, restore, permanent delete, 30-day auto-purge'),
  bullet('RBAC: Admin, Sub-Team Manager, Member, Viewer with 12 granular permissions'),
  bullet('Mobile: Responsive layout, bottom navigation, sidebar overlay'),
  bullet('Accessibility: WCAG AA contrast, ARIA labels, keyboard navigation'),
  heading2('2.2 Out of Scope'),
  bullet('Backend infrastructure / Supabase admin configuration'),
  bullet('CI/CD pipeline and deployment process'),
  bullet('Load testing / stress testing'),
  bullet('Third-party integrations not present in the app'),
  heading2('2.3 Test Environment'),
);

const envColA = 2600;
const envColB = 7480;
const envRows = [
  ['Application URL', 'https://task-manager-eight-vert-91.vercel.app'],
  ['Hosting', 'Vercel (frontend) + Supabase (backend)'],
  ['Supabase Project', 'iojyzntejrxjtnuyfgrs'],
  ['Browsers', 'Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)'],
  ['Mobile Testing', 'Chrome DevTools device emulation + physical devices (iOS Safari, Android Chrome)'],
  ['Screen Resolutions', 'Desktop: 1920x1080, 1440x900 | Tablet: 768x1024 | Mobile: 375x812, 390x844'],
  ['Network', 'Standard broadband; additionally test on throttled 3G for mobile'],
];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [envColA, envColB],
    rows: envRows.map(([k, v], i) => new TableRow({
      children: [
        cell(k, envColA, { shading: COLOR_HEADER_BG, bold: true }),
        cell(v, envColB, { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
      ]
    }))
  }),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 3: TEST ACCOUNTS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('3. Test Accounts & Access'),
  sectionDivider(),
  para('The following test accounts are pre-configured on the production Supabase instance:'),
  emptyLine(),
);

const accColW = [1200, 2800, 2800, 1600, 1680];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: accColW,
    rows: [
      new TableRow({ children: [
        headerCell('Role', accColW[0]),
        headerCell('Email', accColW[1]),
        headerCell('Password', accColW[2]),
        headerCell('Team Role', accColW[3]),
        headerCell('Purpose', accColW[4]),
      ]}),
      new TableRow({ children: [
        cell('Admin', accColW[0], { bold: true }),
        cell('uat.tester@test.com', accColW[1]),
        cell('UatTest123!', accColW[2]),
        cell('Admin', accColW[3]),
        cell('Full access testing', accColW[4]),
      ]}),
      new TableRow({ children: [
        cell('User A', accColW[0], { bold: true, shading: COLOR_ALT_ROW }),
        cell('alice.chat@test.com', accColW[1], { shading: COLOR_ALT_ROW }),
        cell('ChatTest123!', accColW[2], { shading: COLOR_ALT_ROW }),
        cell('Member', accColW[3], { shading: COLOR_ALT_ROW }),
        cell('Member role testing', accColW[4], { shading: COLOR_ALT_ROW }),
      ]}),
      new TableRow({ children: [
        cell('User B', accColW[0], { bold: true }),
        cell('bob.chat@test.com', accColW[1]),
        cell('ChatTest123!', accColW[2]),
        cell('Member', accColW[3]),
        cell('Multi-user testing', accColW[4]),
      ]}),
      new TableRow({ children: [
        cell('User C', accColW[0], { bold: true, shading: COLOR_ALT_ROW }),
        cell('carol.chat@test.com', accColW[1], { shading: COLOR_ALT_ROW }),
        cell('ChatTest123!', accColW[2], { shading: COLOR_ALT_ROW }),
        cell('Viewer', accColW[3], { shading: COLOR_ALT_ROW }),
        cell('Viewer role testing', accColW[4], { shading: COLOR_ALT_ROW }),
      ]}),
    ]
  }),
  emptyLine(),
  boldPara('Team ID: ', '3de9df38-7861-46a7-8a28-791adfa0f581'),
  boldPara('Note: ', 'Before starting UAT, verify all accounts can log in successfully. If any account is locked, reset via Supabase Dashboard > Authentication > Users.'),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 4: ROLES & RESPONSIBILITIES
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('4. Roles & Responsibilities'),
  sectionDivider(),
);

const roleColW = [2200, 3400, 4480];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: roleColW,
    rows: [
      new TableRow({ children: [
        headerCell('Role', roleColW[0]),
        headerCell('Responsibility', roleColW[1]),
        headerCell('Deliverables', roleColW[2]),
      ]}),
      new TableRow({ children: [
        cell('QA Lead', roleColW[0], { bold: true }),
        cell('Own UAT strategy, coordinate execution, triage bugs, final sign-off', roleColW[1]),
        cell('UAT plan, test case reviews, defect triage reports, sign-off document', roleColW[2]),
      ]}),
      new TableRow({ children: [
        cell('QA Engineer', roleColW[0], { bold: true, shading: COLOR_ALT_ROW }),
        cell('Execute test cases, report bugs, verify fixes, regression testing', roleColW[1], { shading: COLOR_ALT_ROW }),
        cell('Executed test cases with Pass/Fail, defect reports, retest results', roleColW[2], { shading: COLOR_ALT_ROW }),
      ]}),
      new TableRow({ children: [
        cell('Release Manager', roleColW[0], { bold: true }),
        cell('Coordinate UAT cycles, manage go/no-go decisions, environment readiness', roleColW[1]),
        cell('UAT schedule, environment checklist, release decision document', roleColW[2]),
      ]}),
      new TableRow({ children: [
        cell('Engineering Manager', roleColW[0], { bold: true, shading: COLOR_ALT_ROW }),
        cell('Prioritize bug fixes, assign to developers, ensure timely resolution', roleColW[1], { shading: COLOR_ALT_ROW }),
        cell('Bug fix assignments, sprint planning updates, fix verification', roleColW[2], { shading: COLOR_ALT_ROW }),
      ]}),
      new TableRow({ children: [
        cell('Product Manager', roleColW[0], { bold: true }),
        cell('Define acceptance criteria, validate business logic, approve UAT results', roleColW[1]),
        cell('Acceptance criteria document, business validation sign-off', roleColW[2]),
      ]}),
    ]
  }),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 5: ENTRY & EXIT CRITERIA
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('5. Entry & Exit Criteria'),
  sectionDivider(),
  heading2('5.1 Entry Criteria (Must be met before UAT begins)'),
  bullet('All development work for the release is complete and merged to main branch'),
  bullet('Application is deployed to the production/staging URL and accessible'),
  bullet('All 7 database migrations (001-007) have been applied successfully'),
  bullet('All test accounts are active and can log in'),
  bullet('No critical or blocker bugs are open from previous testing cycles'),
  bullet('User Manual (v1.1) is reviewed and matches current application behavior'),
  bullet('Test environment (browsers, devices) is prepared and accessible'),
  bullet('UAT Manual (this document) is reviewed and approved by QA Lead and PM'),
  heading2('5.2 Exit Criteria (Must be met to pass UAT)'),
  bullet('100% of Critical and High priority test cases have been executed'),
  bullet('All Critical defects are fixed and verified (0 open Critical bugs)'),
  bullet('All High defects are fixed and verified, or have approved workarounds'),
  bullet('At least 95% of all test cases pass (remaining 5% must be Low priority with documented workarounds)'),
  bullet('All 4 task views render correctly on desktop and mobile'),
  bullet('Real-time features (chat, notifications) verified with multi-user testing'),
  bullet('RBAC verified for all 4 roles (Admin, Sub-Team Manager, Member, Viewer)'),
  bullet('Product Manager has signed off on business logic and user experience'),
  bullet('QA Lead has signed off on test coverage and defect resolution'),
  bullet('Release Manager has approved go-live based on UAT results'),
  heading2('5.3 Suspension Criteria'),
  bullet('Application is inaccessible or deployment is broken'),
  bullet('Critical authentication failure preventing any login'),
  bullet('Database corruption or data loss detected'),
  bullet('More than 3 Critical defects found in a single test cycle'),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 6: DEFECT MANAGEMENT
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('6. Defect Management'),
  sectionDivider(),
  heading2('6.1 Defect Severity Levels'),
);

const sevColW = [1600, 3200, 5280];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: sevColW,
    rows: [
      new TableRow({ children: [
        headerCell('Severity', sevColW[0]),
        headerCell('Definition', sevColW[1]),
        headerCell('Example', sevColW[2]),
      ]}),
      new TableRow({ children: [
        cell('Critical', sevColW[0], { bold: true, color: 'C0392B' }),
        cell('App crash, data loss, security breach, complete feature failure', sevColW[1]),
        cell('Login fails for all users; tasks deleted without user action; RLS bypass', sevColW[2]),
      ]}),
      new TableRow({ children: [
        cell('High', sevColW[0], { bold: true, color: 'E67E22', shading: COLOR_ALT_ROW }),
        cell('Major feature broken, no workaround, significant user impact', sevColW[1], { shading: COLOR_ALT_ROW }),
        cell('Kanban drag-drop not working; bulk actions fail; chat messages not delivered', sevColW[2], { shading: COLOR_ALT_ROW }),
      ]}),
      new TableRow({ children: [
        cell('Medium', sevColW[0], { bold: true, color: 'F39C12' }),
        cell('Feature partially broken, workaround exists, moderate user impact', sevColW[1]),
        cell('Calendar view misaligns on specific dates; filter resets on page change', sevColW[2]),
      ]}),
      new TableRow({ children: [
        cell('Low', sevColW[0], { bold: true, color: '95A5A6', shading: COLOR_ALT_ROW }),
        cell('Cosmetic issue, minor UX annoyance, negligible user impact', sevColW[1], { shading: COLOR_ALT_ROW }),
        cell('Tooltip misaligned by 2px; placeholder text has typo', sevColW[2], { shading: COLOR_ALT_ROW }),
      ]}),
    ]
  }),
  emptyLine(),
  heading2('6.2 Defect Lifecycle'),
  numberedItem('QA Engineer discovers defect during test execution'),
  numberedItem('QA Engineer logs defect using template (Appendix A) with severity, steps to reproduce, screenshots'),
  numberedItem('QA Lead triages and assigns severity; confirms reproducibility'),
  numberedItem('Engineering Manager assigns to developer; sets priority in sprint'),
  numberedItem('Developer fixes and marks as Ready for Retest'),
  numberedItem('QA Engineer retests the fix; marks as Verified or Reopened'),
  numberedItem('QA Lead confirms closure; updates UAT test case status'),
  heading2('6.3 Defect Reporting Channel'),
  bullet('GitHub Issues: https://github.com/Arko-01/task-manager/issues'),
  bullet('Label convention: uat-bug, severity-critical, severity-high, severity-medium, severity-low'),
  bullet('Each defect must include: TC ID, severity, steps to reproduce, expected vs actual, browser/device, screenshot'),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 7: AUTH & ONBOARDING
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('7. Test Execution: Authentication & Onboarding'),
  sectionDivider(),
  para('Login as: Any test account | Priority: Critical'),
  emptyLine(),
  tcTable([
    tcRow('AUTH-001', 'Valid Login', [
      '1. Navigate to app URL',
      '2. Enter uat.tester@test.com',
      '3. Enter password UatTest123!',
      '4. Click "Log In"',
    ], ['User lands on My Tasks dashboard', 'Sidebar shows team name', 'No error messages']),
    tcRow('AUTH-002', 'Invalid Password', [
      '1. Navigate to app URL',
      '2. Enter uat.tester@test.com',
      '3. Enter wrong password "Wrong123"',
      '4. Click "Log In"',
    ], ['Error message displayed', 'User stays on login page', 'No crash or redirect'], true),
    tcRow('AUTH-003', 'Empty Fields Validation', [
      '1. Navigate to login page',
      '2. Leave email and password empty',
      '3. Click "Log In"',
    ], ['Form validation prevents submission', 'Error indicators on empty fields']),
    tcRow('AUTH-004', 'Sign Up - New Account', [
      '1. Click "Sign Up" link on login page',
      '2. Enter full name, new email, password (6+ chars)',
      '3. Click "Sign Up"',
    ], ['Account created successfully', 'User lands on dashboard', 'Welcome guide displayed'], true),
    tcRow('AUTH-005', 'Sign Up - Duplicate Email', [
      '1. Click "Sign Up"',
      '2. Enter existing email (uat.tester@test.com)',
      '3. Enter name and password',
      '4. Click "Sign Up"',
    ], ['Error: email already registered', 'User stays on signup page']),
    tcRow('AUTH-006', 'Sign Up - Short Password', [
      '1. Click "Sign Up"',
      '2. Enter valid name and email',
      '3. Enter password less than 6 characters',
      '4. Click "Sign Up"',
    ], ['Error: password too short', 'Form does not submit'], true),
    tcRow('AUTH-007', 'Session Persistence', [
      '1. Log in successfully',
      '2. Close browser tab',
      '3. Open app URL in new tab',
    ], ['User is still logged in', 'Dashboard loads without login prompt']),
    tcRow('AUTH-008', 'Log Out', [
      '1. Log in successfully',
      '2. Click logout button in sidebar',
    ], ['User redirected to login page', 'Session is cleared', 'Cannot access dashboard via URL'], true),
    tcRow('AUTH-009', 'Welcome Guide (Onboarding)', [
      '1. Log in with a fresh account (no team)',
      '2. Observe the Welcome Guide',
      '3. Complete all 3 steps: Join Team, Create Project, Add Task',
    ], ['Guide shows 3 steps with checkmarks', 'Completed steps get checked', 'Guide disappears after all 3 done']),
    tcRow('AUTH-010', 'Dismiss Welcome Guide', [
      '1. Log in with fresh account',
      '2. See Welcome Guide',
      '3. Click "Dismiss" button',
    ], ['Guide disappears immediately', 'Does not reappear on refresh'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 8: DASHBOARD
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('8. Test Execution: Dashboard (My Tasks)'),
  sectionDivider(),
  para('Login as: uat.tester@test.com (Admin) | Priority: Critical'),
  emptyLine(),
  tcTable([
    tcRow('DASH-001', 'Dashboard Loads', [
      '1. Log in as admin',
      '2. Observe the My Tasks page',
    ], ['Page loads without errors', 'Tasks grouped by status (To Do, In Progress, On Hold, Done)', 'View tabs visible (List, Board, Calendar, Gantt)']),
    tcRow('DASH-002', 'Tasks Show Across All Projects', [
      '1. Ensure admin is assigned tasks in multiple projects',
      '2. Open dashboard',
    ], ['Tasks from all projects appear', 'Each task shows project tag/label'], true),
    tcRow('DASH-003', 'Quick Add (Dashboard)', [
      '1. Find the Quick Add bar',
      '2. Click "Select Project" dropdown',
      '3. Select a project',
      '4. Type "UAT Test Task Dashboard"',
      '5. Press Enter',
    ], ['Task created successfully', 'Appears in To Do section', 'Default priority: Medium', 'Default status: To Do']),
    tcRow('DASH-004', 'Quick Add Without Project', [
      '1. On Dashboard, find Quick Add',
      '2. Type task name WITHOUT selecting project',
      '3. Press Enter',
    ], ['Prompt to select project first', 'Task not created without project'], true),
    tcRow('DASH-005', 'View Tab Switching', [
      '1. Click "Board" tab',
      '2. Click "Calendar" tab',
      '3. Click "Gantt" tab',
      '4. Click "List" tab',
    ], ['Each view loads correctly', 'Tasks render appropriately in each view', 'No data loss between switches']),
    tcRow('DASH-006', 'Sidebar Navigation', [
      '1. Check sidebar shows team name',
      '2. Check PROJECTS section shows up to 5 projects',
      '3. If >5 projects, click "Show all"',
      '4. Click "Show less" to collapse',
    ], ['Team name displayed correctly', 'Projects limited to 5 initially', '"Show all"/"Show less" toggle works'], true),
    tcRow('DASH-007', 'Sidebar Project Click', [
      '1. Click any project name in sidebar',
    ], ['Navigates to Project page', 'Project tasks load correctly', 'URL changes to /projects/:id']),
    tcRow('DASH-008', 'Task Click Opens Detail', [
      '1. On dashboard, click any task title',
    ], ['Task Detail panel opens on right', 'All fields are visible', 'Chat panel closes if open'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 9: PROJECTS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('9. Test Execution: Projects'),
  sectionDivider(),
  para('Login as: uat.tester@test.com (Admin) | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('PROJ-001', 'Create New Project', [
      '1. In sidebar, click "+" next to PROJECTS',
      '2. Enter name: "UAT Test Project"',
      '3. Select an emoji',
      '4. Set start date (today) and end date (+30 days)',
      '5. Click Create',
    ], ['Project created, appears in sidebar', 'Default "General" is NOT created (only for team creation)', 'Project page loads with empty task list']),
    tcRow('PROJ-002', 'Project Page Elements', [
      '1. Navigate to created project',
      '2. Verify all UI elements',
    ], ['Project name + emoji displayed', 'Status badge (Not Started)', 'Progress bar at 0%', 'Date range shown', 'All 4 view tabs present', 'Templates button visible'], true),
    tcRow('PROJ-003', 'Project Status Updates', [
      '1. Add tasks to project',
      '2. Move some to In Progress',
      '3. Move some to Done',
      '4. Observe project status badge',
    ], ['Status changes based on task completion', 'Progress bar reflects % of done tasks']),
    tcRow('PROJ-004', 'Project With Overdue Tasks', [
      '1. Create task with past end date',
      '2. Leave status as "To Do"',
      '3. Observe project status',
    ], ['Project shows "Overdue" status if end date passed and not all tasks done'], true),
    tcRow('PROJ-005', 'Navigate Between Projects', [
      '1. Click different projects in sidebar',
      '2. Verify each loads its own tasks',
    ], ['Each project shows only its own tasks', 'No cross-project data leakage']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 10: TASK CREATION
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('10. Test Execution: Task Creation'),
  sectionDivider(),
  para('Login as: uat.tester@test.com (Admin) | Priority: Critical'),
  emptyLine(),
  tcTable([
    tcRow('TASK-001', 'Quick Add in Project', [
      '1. Navigate to a project page',
      '2. Type "Quick Add Task" in the add bar',
      '3. Press Enter',
    ], ['Task created in To Do', 'Priority: Medium (default)', 'Start date: today, End date: today+7']),
    tcRow('TASK-002', 'Calendar Click-to-Create', [
      '1. In a Project page, switch to Calendar view',
      '2. Click on a future date cell',
      '3. See inline form appear below calendar',
      '4. Type task name "Calendar Task"',
      '5. Click "Add"',
    ], ['Form appears with clicked date pre-filled', 'Task created on that date', 'Task visible on calendar'], true),
    tcRow('TASK-003', 'Create From Template', [
      '1. In Project page, click "Templates"',
      '2. Click "Create Template"',
      '3. Enter template name, title, description',
      '4. Click Save',
      '5. Click "Use" on the saved template',
    ], ['Template saved in list', 'Task created with template title + description', 'Status: To Do, Priority from template']),
    tcRow('TASK-004', 'Delete Template', [
      '1. Open Templates modal',
      '2. Click Delete on a template',
    ], ['Template removed from list', 'No effect on previously created tasks'], true),
    tcRow('TASK-005', 'Create Sub-Task (Level 1)', [
      '1. Click a task to open detail panel',
      '2. Scroll to Sub-tasks section',
      '3. Type "Sub-task Level 1" in add bar',
      '4. Press Enter',
    ], ['Sub-task created under parent', 'Sub-task count shows "0/1"', 'Sub-task inherits project']),
    tcRow('TASK-006', 'Create Sub-Task (Level 2)', [
      '1. Click the Level 1 sub-task',
      '2. In its detail panel, add another sub-task',
      '3. Type "Sub-task Level 2" and Enter',
    ], ['Level 2 sub-task created', 'Nested under Level 1'], true),
    tcRow('TASK-007', 'Sub-Task Depth Limit (Level 3 Blocked)', [
      '1. Click the Level 2 sub-task',
      '2. Try to add a sub-task under it',
    ], ['Error: "Maximum nesting depth (2 levels) reached"', 'Sub-task NOT created']),
    tcRow('TASK-008', 'Duplicate Task', [
      '1. Open any task detail',
      '2. Click the copy/duplicate icon in header',
    ], ['New task created with "(copy)" suffix in title', 'Same project, description, priority', 'Independent from original'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 11: TASK VIEWS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('11. Test Execution: Task Views'),
  sectionDivider(),
  heading2('11.1 List View'),
  para('Login as: uat.tester@test.com | Priority: Critical'),
  emptyLine(),
  tcTable([
    tcRow('VIEW-001', 'List View - Task Grouping', [
      '1. Switch to List view',
      '2. Observe task grouping',
    ], ['Tasks grouped by status: To Do, In Progress, On Hold, Done', 'Each group has header', 'Collapsible groups']),
    tcRow('VIEW-002', 'List View - Task Row Elements', [
      '1. Examine any task row',
    ], ['Priority dot (colored: red/orange/yellow/gray)', 'Task title (clickable)', 'Status badge', 'Assignee avatars', 'Due date (red if overdue)', 'Sub-task count', 'Checkbox for bulk select'], true),
    tcRow('VIEW-003', 'List View - Overdue Indicator', [
      '1. Find/create a task with past due date',
      '2. Keep status as To Do or In Progress',
    ], ['Due date text turns red', 'Clearly indicates overdue']),
  ]),
  emptyLine(),
  heading2('11.2 Board View (Kanban)'),
  emptyLine(),
  tcTable([
    tcRow('VIEW-004', 'Board View - Columns', [
      '1. Switch to Board view',
      '2. Verify 4 columns',
    ], ['4 columns: To Do, In Progress, On Hold, Done', 'Task cards in correct columns']),
    tcRow('VIEW-005', 'Board View - Drag and Drop', [
      '1. Drag a task card from "To Do" column',
      '2. Drop it in "In Progress" column',
    ], ['Card moves to new column', 'Task status updates to In Progress', 'Change persists on refresh'], true),
    tcRow('VIEW-006', 'Board View - Card Details', [
      '1. Examine a task card on the board',
    ], ['Shows title, priority dot, due date', 'Assignee avatars', 'Project tag', 'Click opens task detail']),
    tcRow('VIEW-007', 'Board View - Keyboard Navigation', [
      '1. Use Tab to focus a Kanban card',
      '2. Use arrow keys to navigate',
    ], ['Cards are focusable', 'ARIA labels present', 'Keyboard navigation works'], true),
  ]),
  emptyLine(),
  heading2('11.3 Calendar View'),
  emptyLine(),
  tcTable([
    tcRow('VIEW-008', 'Calendar View - Task Bars', [
      '1. Switch to Calendar view',
      '2. Observe task display',
    ], ['Tasks shown as colored bars by priority', 'Red=Urgent, Orange=High, Yellow=Medium, Gray=Low']),
    tcRow('VIEW-009', 'Calendar View - Navigation', [
      '1. Click forward/back arrows',
      '2. Click "today" button',
    ], ['Month changes correctly', '"Today" returns to current month', 'Tasks update per month'], true),
    tcRow('VIEW-010', 'Calendar View - Task Click', [
      '1. Click a task bar on calendar',
    ], ['Task detail panel opens', 'Correct task data displayed']),
  ]),
  emptyLine(),
  heading2('11.4 Gantt View'),
  emptyLine(),
  tcTable([
    tcRow('VIEW-011', 'Gantt View - Timeline', [
      '1. Switch to Gantt view',
      '2. Observe chart',
    ], ['Left: task names, Right: timeline bars', 'Red vertical line = today', 'Colors: gray=todo, blue=in-progress, amber=on-hold, green=done']),
    tcRow('VIEW-012', 'Gantt View - Dependencies', [
      '1. Create two tasks with dependency',
      '2. Switch to Gantt view',
    ], ['Arrows drawn between dependent task bars', 'Direction indicates blocking relationship'], true),
    tcRow('VIEW-013', 'Gantt View - Task Click', [
      '1. Click a task name on Gantt',
    ], ['Task detail panel opens', 'Shows correct task information']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 12: TASK DETAILS & EDITING
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('12. Test Execution: Task Details & Editing'),
  sectionDivider(),
  para('Login as: uat.tester@test.com (Admin) | Priority: Critical'),
  emptyLine(),
  tcTable([
    tcRow('DET-001', 'Edit Task Title', [
      '1. Open task detail panel',
      '2. Click on the title text',
      '3. Change to "Updated Title"',
      '4. Click away (blur)',
    ], ['Title updates immediately', 'Persists on refresh', 'Reflects in list/board views']),
    tcRow('DET-002', 'Change Status', [
      '1. Open task detail',
      '2. Click status dropdown',
      '3. Select "In Progress"',
    ], ['Status badge updates', 'Task moves to correct group in List view', 'Card moves in Board view'], true),
    tcRow('DET-003', 'Change Priority', [
      '1. Open task detail',
      '2. Click priority dropdown',
      '3. Select "Urgent"',
    ], ['Priority dot changes to red', 'Calendar bar color updates to red', 'Persists on refresh']),
    tcRow('DET-004', 'Edit Start Date', [
      '1. Open task detail',
      '2. Click start date picker',
      '3. Select a new date',
    ], ['Date updates', 'Calendar and Gantt reflect change'], true),
    tcRow('DET-005', 'End Date Before Start Date', [
      '1. Set end date BEFORE start date',
    ], ['Validation error', 'End date must be >= start date', 'Change rejected']),
    tcRow('DET-006', 'Edit Description', [
      '1. Open task detail',
      '2. Click description area',
      '3. Type multi-line description',
      '4. Click away',
    ], ['Description saved', 'Multi-line text preserved', 'Persists on refresh'], true),
    tcRow('DET-007', 'Assign Primary Assignee', [
      '1. Open task detail',
      '2. In Assignees section, click "+"',
      '3. Click "Primary" next to a team member',
    ], ['Member added as Primary', 'Avatar shown with "P" indicator', 'Notification sent to assignee']),
    tcRow('DET-008', 'Assign Secondary Assignee', [
      '1. Click "+" in Assignees',
      '2. Click "Secondary" next to different member',
    ], ['Member added as Secondary', 'Both Primary and Secondary shown'], true),
    tcRow('DET-009', 'Remove Assignee', [
      '1. Click "X" next to an assignee',
    ], ['Assignee removed', 'No longer shown on task', 'Task removed from their My Tasks']),
    tcRow('DET-010', 'Switch Assignee Role', [
      '1. Click the P/S toggle button next to assignee',
    ], ['Role switches (Primary to Secondary or vice versa)', 'Visual indicator updates'], true),
    tcRow('DET-011', 'Add Dependency', [
      '1. In Dependencies section, click "+ Add dependency"',
      '2. Search for another task',
      '3. Click it to add',
    ], ['Dependency added', 'Shown in dependency list', 'Gantt view shows arrow']),
    tcRow('DET-012', 'Circular Dependency Blocked', [
      '1. Task A depends on Task B',
      '2. Open Task B detail',
      '3. Try to add Task A as dependency',
    ], ['Error: "This would create a circular dependency."', 'Dependency NOT added'], true),
    tcRow('DET-013', 'Self-Dependency Blocked', [
      '1. Open Task A detail',
      '2. Try to add Task A as its own dependency',
    ], ['Error: "A task cannot depend on itself."', 'Dependency NOT added']),
    tcRow('DET-014', 'Set Recurrence - Daily', [
      '1. Open task detail',
      '2. Find Recurrence section',
      '3. Toggle recurrence ON',
      '4. Select "Daily", interval 1',
    ], ['Recurrence label shows "Every 1 day(s)"', 'Task marked as recurring', 'Persists on refresh'], true),
    tcRow('DET-015', 'Set Recurrence - Weekly', [
      '1. Set frequency to "Weekly"',
      '2. Select Mon, Wed, Fri',
      '3. Set interval to 1',
    ], ['Label shows "Every 1 week(s) on Mon, Wed, Fri"', 'Days of week stored correctly']),
    tcRow('DET-016', 'Set Recurrence - Monthly', [
      '1. Set frequency to "Monthly"',
      '2. Set interval to 2',
    ], ['Label shows "Every 2 month(s)"', 'Stored correctly'], true),
    tcRow('DET-017', 'Remove Recurrence', [
      '1. Click remove recurrence button',
    ], ['Recurrence disabled', 'Label shows "Not recurring"']),
    tcRow('DET-018', 'Add Comment', [
      '1. Scroll to Comments section',
      '2. Type "This is a UAT test comment"',
      '3. Click send button',
    ], ['Comment appears with user name and timestamp', 'Notification sent to other assignees'], true),
    tcRow('DET-019', 'Delete Own Comment', [
      '1. Find your own comment',
      '2. Click trash icon',
    ], ['Comment removed', 'Other comments unaffected']),
    tcRow('DET-020', 'Delete Task', [
      '1. Click trash icon in task detail header',
    ], ['Task removed from view', 'Task appears in Trash page', 'Not permanently deleted yet'], true),
    tcRow('DET-021', 'Conflict Detection', [
      '1. Open same task in two browser tabs',
      '2. Edit title in Tab 1 and save',
      '3. Edit title in Tab 2 and save',
    ], ['Tab 2 shows error: "This task was modified by someone else. Please refresh and try again."', 'Data integrity preserved']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 13: FILTERS & SORTING
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('13. Test Execution: Filters & Sorting'),
  sectionDivider(),
  para('Login as: uat.tester@test.com | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('FILT-001', 'Search Filter', [
      '1. Type task name in search box',
      '2. Observe results',
    ], ['Only matching tasks shown', 'Case-insensitive match', 'Results update as you type']),
    tcRow('FILT-002', 'Status Filter', [
      '1. Click Status dropdown',
      '2. Select "In Progress"',
    ], ['Only In Progress tasks visible', 'Other statuses hidden'], true),
    tcRow('FILT-003', 'Priority Filter', [
      '1. Click Priority dropdown',
      '2. Select "Urgent"',
    ], ['Only priority 1 (Urgent) tasks shown']),
    tcRow('FILT-004', 'Role Filter (My Tasks)', [
      '1. On Dashboard (My Tasks)',
      '2. Click Role dropdown',
      '3. Select "Primary"',
    ], ['Only tasks where you are Primary assignee shown'], true),
    tcRow('FILT-005', 'Assignee Filter (Team Dashboard)', [
      '1. Navigate to Team Dashboard',
      '2. Click Assignee dropdown',
      '3. Select a specific user',
    ], ['Only that user\'s tasks shown']),
    tcRow('FILT-006', 'Combined Filters', [
      '1. Set Status = In Progress',
      '2. Set Priority = High',
      '3. Type search term',
    ], ['All filters applied simultaneously', 'Only matching tasks shown'], true),
    tcRow('FILT-007', 'Clear All Filters', [
      '1. With multiple filters active',
      '2. Click the Clear (X) button',
    ], ['All filters reset', 'All tasks visible again']),
    tcRow('FILT-008', 'Sort by Due Date', [
      '1. Click Sort dropdown',
      '2. Select "Due date"',
    ], ['Tasks ordered by end date ascending', 'Earliest due dates first'], true),
    tcRow('FILT-009', 'Sort by Priority', [
      '1. Select sort: "Priority"',
    ], ['Tasks ordered by priority descending', 'Urgent (1) first, Low (4) last']),
    tcRow('FILT-010', 'Sort by Title', [
      '1. Select sort: "Title"',
    ], ['Tasks ordered alphabetically by title'], true),
    tcRow('FILT-011', 'Sort by Created', [
      '1. Select sort: "Created"',
    ], ['Tasks ordered by creation date ascending']),
    tcRow('FILT-012', 'Filter Persistence', [
      '1. Set filters and sort',
      '2. Navigate away from page',
      '3. Return to same page',
    ], ['Filters persist via localStorage', 'Same filters applied on return'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 14: BULK ACTIONS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('14. Test Execution: Bulk Actions'),
  sectionDivider(),
  para('Login as: uat.tester@test.com | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('BULK-001', 'Select Multiple Tasks', [
      '1. In List view, click checkbox on 3+ tasks',
    ], ['Checkboxes checked', 'Bottom toolbar appears', 'Shows "{count} selected"']),
    tcRow('BULK-002', 'Bulk Change Status', [
      '1. Select 3 tasks',
      '2. Click "In Progress" in toolbar',
    ], ['All 3 tasks change to In Progress', 'Tasks move to In Progress group', 'Selection cleared'], true),
    tcRow('BULK-003', 'Bulk Set Priority', [
      '1. Select multiple tasks',
      '2. Click "Priority" dropdown',
      '3. Select "Urgent"',
    ], ['All selected tasks become Urgent', 'Priority dots turn red']),
    tcRow('BULK-004', 'Bulk Assign', [
      '1. Select multiple tasks',
      '2. Click "Assign" dropdown',
      '3. Select a team member',
    ], ['Member added as Secondary to all selected tasks', 'Notifications sent'], true),
    tcRow('BULK-005', 'Bulk Shift Dates (+7 days)', [
      '1. Select tasks with dates',
      '2. Click "Shift Dates"',
      '3. Click "+7 days"',
    ], ['All selected tasks\' start and end dates shift by +7 days', 'Calendar/Gantt views reflect change']),
    tcRow('BULK-006', 'Bulk Shift Dates (-1 day)', [
      '1. Select tasks',
      '2. Click "Shift Dates" > "-1 day"',
    ], ['Dates shift back by 1 day'], true),
    tcRow('BULK-007', 'Bulk Shift Dates (Custom)', [
      '1. Select tasks',
      '2. Click "Shift Dates"',
      '3. Type "14" in custom input',
      '4. Click "Go"',
    ], ['Dates shift by +14 days']),
    tcRow('BULK-008', 'Bulk Delete', [
      '1. Select multiple tasks',
      '2. Click "Delete" button',
    ], ['All selected tasks moved to Trash', 'Removed from current view', 'Recoverable from Trash page'], true),
    tcRow('BULK-009', 'Deselect All', [
      '1. With tasks selected, click "X" button',
    ], ['All checkboxes unchecked', 'Toolbar disappears']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 15: TEAM DASHBOARD
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('15. Test Execution: Team Dashboard'),
  sectionDivider(),
  para('Login as: uat.tester@test.com | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('TEAM-001', 'Team Dashboard Loads', [
      '1. Click "Team" in sidebar or bottom nav',
    ], ['Team name shown at top', 'All 4 stat cards visible', 'Tasks from all projects displayed']),
    tcRow('TEAM-002', 'Stat Cards Accuracy', [
      '1. Note the 4 stat cards:',
      '   - Total Tasks',
      '   - In Progress',
      '   - Overdue',
      '   - Done This Week',
      '2. Cross-check with actual task data',
    ], ['Total Tasks matches count of all team tasks', 'In Progress matches status count', 'Overdue: past due + not done', 'Done This Week: done in last 7 days'], true),
    tcRow('TEAM-003', 'Assignee Filter', [
      '1. On Team Dashboard',
      '2. Use Assignee dropdown',
      '3. Select "Alice"',
    ], ['Only Alice\'s tasks shown', 'All views update accordingly']),
    tcRow('TEAM-004', 'All 4 Views Available', [
      '1. Switch between List, Board, Calendar, Gantt',
    ], ['Each view loads correctly', 'Shows team-wide tasks, not just yours'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 16: CHAT
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('16. Test Execution: Chat & Real-Time Messaging'),
  sectionDivider(),
  para('Login as: Multiple accounts in separate browser windows | Priority: High'),
  boldPara('Setup: ', 'Open uat.tester@test.com in Browser 1, alice.chat@test.com in Browser 2 (incognito/different browser).'),
  emptyLine(),
  tcTable([
    tcRow('CHAT-001', 'Open Chat Panel', [
      '1. Click chat bubble icon in header',
    ], ['Chat panel slides in from right', 'Task detail panel closes if open', 'Conversation list visible']),
    tcRow('CHAT-002', 'Create Direct Conversation', [
      '1. Click "+" button in chat panel',
      '2. Select "Direct"',
      '3. Choose Alice from member list',
    ], ['Direct conversation created', 'Appears in conversation list', 'Chat area ready for messages'], true),
    tcRow('CHAT-003', 'Send Message', [
      '1. In the DM with Alice',
      '2. Type "Hello from UAT!"',
      '3. Press Enter or click send',
    ], ['Message appears in chat', 'Shows sender name + timestamp', 'Message delivered instantly']),
    tcRow('CHAT-004', 'Real-Time Message Delivery', [
      '1. In Browser 1 (Admin), send message to Alice',
      '2. Check Browser 2 (Alice)',
    ], ['Message appears in Alice\'s chat in real-time', 'No page refresh needed', 'Unread count badge updates'], true),
    tcRow('CHAT-005', 'Create Group Conversation', [
      '1. Click "+" > "Group"',
      '2. Name: "UAT Test Group"',
      '3. Select Alice and Bob',
      '4. Click "Create Group"',
    ], ['Group created with all selected members', 'Group name displayed', 'All members can see the group']),
    tcRow('CHAT-006', 'Group Messaging', [
      '1. Send message in group',
      '2. Check all members\' views',
    ], ['All group members receive message', 'Real-time delivery to all'], true),
    tcRow('CHAT-007', 'Unread Count Badge', [
      '1. Send messages to Alice while she\'s not viewing chat',
      '2. Check Alice\'s chat icon',
    ], ['Red badge with unread count appears', 'Badge shows "9+" if count > 9']),
    tcRow('CHAT-008', 'Mark as Read', [
      '1. As Alice, open the conversation',
      '2. Read the messages',
    ], ['Unread count resets', 'Badge disappears'], true),
    tcRow('CHAT-009', 'Chat + Task Detail Exclusivity', [
      '1. Open a task detail panel',
      '2. Click chat icon',
    ], ['Task detail closes', 'Chat panel opens', 'No overlap or UI conflict']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 17: NOTIFICATIONS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('17. Test Execution: Notifications'),
  sectionDivider(),
  para('Login as: Multiple accounts | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('NOTIF-001', 'Task Assignment Notification', [
      '1. As Admin, assign Alice to a task',
      '2. Check Alice\'s notification bell',
    ], ['Alice receives notification', 'Text: "[Admin Name] assigned you to \'[Task Title]\'"', 'Bell badge increments']),
    tcRow('NOTIF-002', 'Comment Notification', [
      '1. Alice is assigned to a task',
      '2. As Admin, add a comment on that task',
      '3. Check Alice\'s notifications',
    ], ['Alice receives comment notification', 'Text: "[Admin Name] commented on \'[Task Title]\'"', 'Admin does NOT get self-notification'], true),
    tcRow('NOTIF-003', 'Status Change Notification', [
      '1. Alice is assigned to a task',
      '2. As Admin, change task status to Done',
      '3. Check Alice\'s notifications',
    ], ['Alice receives status notification', 'Text: "[Admin Name] moved \'[Task Title]\' to done"']),
    tcRow('NOTIF-004', 'Notification Click', [
      '1. Click a notification in the dropdown',
    ], ['Notification marked as read', 'Navigates to related task', 'Task detail opens'], true),
    tcRow('NOTIF-005', 'Mark All as Read', [
      '1. With multiple unread notifications',
      '2. Click "Mark all read"',
    ], ['All notifications marked read', 'Badge disappears', 'Notification items show read state']),
    tcRow('NOTIF-006', 'Real-Time Notification', [
      '1. Keep Alice\'s browser open',
      '2. As Admin, assign new task to Alice',
      '3. Watch Alice\'s bell icon',
    ], ['Badge updates in real-time', 'No page refresh needed'], true),
    tcRow('NOTIF-007', 'Notification Preferences - Disable', [
      '1. As Alice, go to Profile',
      '2. Toggle OFF "Task assigned to me"',
      '3. As Admin, assign another task to Alice',
    ], ['Alice does NOT receive assignment notification', 'Other notification types still work']),
    tcRow('NOTIF-008', 'Quiet Hours', [
      '1. As Alice, enable Quiet Hours',
      '2. Set range covering current time',
      '3. Trigger a notification for Alice',
    ], ['Notification suppressed during quiet hours', 'Notification arrives after quiet hours end'], true),
    tcRow('NOTIF-009', 'Max 50 Notifications', [
      '1. Generate many notifications for a user',
      '2. Open notification dropdown',
    ], ['Maximum 50 shown', 'Oldest are dropped when limit reached']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 18: SEARCH & SHORTCUTS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('18. Test Execution: Search & Keyboard Shortcuts'),
  sectionDivider(),
  para('Login as: uat.tester@test.com | Priority: Medium'),
  emptyLine(),
  tcTable([
    tcRow('SRCH-001', 'Open Command Palette (Ctrl+K)', [
      '1. Press Ctrl+K (or Cmd+K on Mac)',
    ], ['Search modal appears centered', 'Input focused and ready to type']),
    tcRow('SRCH-002', 'Search for Task', [
      '1. Open command palette',
      '2. Type a known task name',
      '3. Use arrow keys to navigate',
      '4. Press Enter',
    ], ['Results appear as you type', 'Arrow keys highlight results', 'Enter opens selected task'], true),
    tcRow('SRCH-003', 'Quick Actions', [
      '1. Open command palette',
      '2. Observe Quick Actions section',
    ], ['Quick Actions visible: New task, Toggle dark mode, Settings, Trash']),
    tcRow('SRCH-004', 'Shortcut: / (alternative search)', [
      '1. Focus NOT on any input field',
      '2. Press / key',
    ], ['Command palette opens (same as Ctrl+K)'], true),
    tcRow('SRCH-005', 'Shortcut: N (new task)', [
      '1. Focus NOT on any input field',
      '2. Press N key',
    ], ['Quick Add input gets focused', 'Ready to type task name']),
    tcRow('SRCH-006', 'Shortcut: 1-4 (switch views)', [
      '1. Press 1 key',
      '2. Press 2 key',
      '3. Press 3 key',
      '4. Press 4 key',
    ], ['1=List, 2=Board, 3=Calendar, 4=Gantt', 'View switches correctly each time'], true),
    tcRow('SRCH-007', 'Shortcut: ? (help)', [
      '1. Press ? key',
    ], ['Keyboard shortcuts help modal appears', 'Lists all shortcuts']),
    tcRow('SRCH-008', 'Shortcut: Escape', [
      '1. Open any modal/panel',
      '2. Press Escape',
    ], ['Modal/panel closes', 'Works from search, task detail, chat'], true),
    tcRow('SRCH-009', 'Shortcuts Ignored in Input Fields', [
      '1. Focus on a text input',
      '2. Press N, 1, 2, 3, 4, ?, /',
    ], ['Characters typed normally', 'Shortcuts NOT triggered', 'Ctrl+K and Escape still work from inputs']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 19: ADMIN PANEL
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('19. Test Execution: Admin Panel'),
  sectionDivider(),
  para('Login as: uat.tester@test.com (Admin) | Priority: Critical'),
  emptyLine(),
  tcTable([
    tcRow('ADMIN-001', 'Access Admin Panel', [
      '1. Click "Admin" in sidebar',
    ], ['Admin page loads', '3 tabs visible: Members, Sub-Teams, Settings']),
    tcRow('ADMIN-002', 'Members Tab - View All', [
      '1. Click Members tab',
      '2. Observe member list',
    ], ['All team members listed', 'Each shows: name, email, role, permissions', 'Current user marked'], true),
    tcRow('ADMIN-003', 'Change Member Role', [
      '1. Find Alice in member list',
      '2. Change role dropdown to "Sub-Team Manager"',
    ], ['Role updates', 'Permissions update to Sub-Team Manager defaults', 'Alice\'s access changes accordingly']),
    tcRow('ADMIN-004', 'Custom Permissions', [
      '1. Find a Member-role user',
      '2. Toggle individual permissions ON/OFF',
    ], ['Each permission toggles independently', 'Changes persist', '12 permissions available'], true),
    tcRow('ADMIN-005', 'Invite New Member', [
      '1. Click "Invite Member" in sidebar',
      '2. Enter email of existing account',
      '3. Click "Invite"',
    ], ['User added to team as Member', 'Appears in member list']),
    tcRow('ADMIN-006', 'Invite Non-Existent Email', [
      '1. Enter email that has no account',
      '2. Click "Invite"',
    ], ['Error: "No user found with that email. They need to sign up first."'], true),
    tcRow('ADMIN-007', 'Invite Existing Member', [
      '1. Enter email of someone already on team',
      '2. Click "Invite"',
    ], ['Error: "User is already a member of this team."']),
    tcRow('ADMIN-008', 'Remove Member', [
      '1. Click remove button next to a member (not admin)',
    ], ['Member removed from team', 'Their tasks get unassigned automatically', 'Member no longer sees team'], true),
    tcRow('ADMIN-009', 'Remove Last Admin (Blocked)', [
      '1. With only 1 admin on team',
      '2. Try to remove that admin',
    ], ['Error: "Cannot remove the last admin. Promote another member first."', 'Admin NOT removed']),
    tcRow('ADMIN-010', 'Demote Last Admin (Blocked)', [
      '1. With only 1 admin',
      '2. Try to change their role to Member',
    ], ['Error: "Cannot demote the last admin. Promote another member first."', 'Role NOT changed'], true),
    tcRow('ADMIN-011', 'Sub-Teams Tab - Create', [
      '1. Click Sub-Teams tab',
      '2. Click "New Sub-Team"',
      '3. Enter name: "Design Team"',
      '4. Add members via dropdown',
    ], ['Sub-team created', 'Members shown as chips', 'Appears in sub-team list']),
    tcRow('ADMIN-012', 'Sub-Teams - Add/Remove Members', [
      '1. In a sub-team, use dropdown to add member',
      '2. Click X on a member chip to remove',
    ], ['Member added/removed from sub-team', 'Dropdown only shows non-members'], true),
    tcRow('ADMIN-013', 'Sub-Teams - Delete', [
      '1. Click delete on a sub-team',
    ], ['Sub-team removed', 'Members unaffected (still on main team)']),
    tcRow('ADMIN-014', 'Settings Tab', [
      '1. Click Settings tab',
      '2. Change team name',
      '3. Edit team description',
      '4. Click "Save Changes"',
    ], ['Name and description update', 'Sidebar reflects new team name', 'Persists on refresh'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 20: PROFILE & SETTINGS
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('20. Test Execution: Profile & Settings'),
  sectionDivider(),
  para('Login as: uat.tester@test.com | Priority: Medium'),
  emptyLine(),
  tcTable([
    tcRow('PROF-001', 'Profile Page Loads', [
      '1. Click avatar/Profile in sidebar',
    ], ['Profile page loads', 'Shows avatar, email (read-only), full name', 'Theme options and notification prefs visible']),
    tcRow('PROF-002', 'Edit Full Name', [
      '1. Change full name to "UAT Tester Updated"',
      '2. Click "Save Changes"',
    ], ['Name updates', 'Reflected in header/sidebar', 'Other users see updated name'], true),
    tcRow('PROF-003', 'Theme - Light Mode', [
      '1. Click "Light" theme button',
    ], ['App switches to white background, dark text', 'All pages use light theme']),
    tcRow('PROF-004', 'Theme - Dark Mode', [
      '1. Click "Dark" theme button',
    ], ['App switches to dark background, light text', 'All components render in dark mode', 'No contrast or readability issues'], true),
    tcRow('PROF-005', 'Theme - System', [
      '1. Click "System" theme button',
    ], ['Theme matches device/OS setting', 'Toggles if OS theme changes']),
    tcRow('PROF-006', 'Theme Toggle (Header)', [
      '1. Click sun/moon icon in header',
    ], ['Theme toggles between light and dark', 'Quick toggle matches profile setting'], true),
    tcRow('PROF-007', 'Notification Prefs - Toggle', [
      '1. Toggle OFF "Task assigned to me"',
      '2. Toggle OFF "New comment on my tasks"',
      '3. Toggle OFF "Status changed on my tasks"',
    ], ['Each toggle saves automatically', 'Corresponding notifications stop arriving']),
    tcRow('PROF-008', 'Quiet Hours Setup', [
      '1. Enable Quiet Hours toggle',
      '2. Set start: 22:00, end: 08:00',
    ], ['Quiet hours saved', 'Notifications suppressed during that window'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 21: TRASH
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('21. Test Execution: Trash & Recovery'),
  sectionDivider(),
  para('Login as: uat.tester@test.com | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('TRASH-001', 'Trash Page Access', [
      '1. Click "Trash" in sidebar',
    ], ['Trash page loads', 'Shows deleted tasks with delete timestamp']),
    tcRow('TRASH-002', 'Restore Task', [
      '1. Delete a task',
      '2. Go to Trash page',
      '3. Click "Restore" next to the task',
    ], ['Task returns to its original project', 'Removed from Trash', 'All data intact (title, priority, assignees)'], true),
    tcRow('TRASH-003', 'Permanent Delete', [
      '1. In Trash, click "Delete" on a task',
    ], ['Task permanently removed', 'Cannot be recovered', 'No longer in any view or database']),
    tcRow('TRASH-004', 'Trash Empty State', [
      '1. Restore or permanently delete all items',
    ], ['Empty state message shown', 'No tasks listed'], true),
    tcRow('TRASH-005', '30-Day Auto-Purge (If pg_cron enabled)', [
      '1. Check if pg_cron extension is enabled',
      '2. If yes: verify tasks trashed 30+ days ago are auto-deleted',
      '3. If no: document as N/A with note',
    ], ['Tasks trashed 30+ days are auto-purged', 'Or: N/A if pg_cron not enabled (requires Supabase Pro)']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 22: RBAC
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('22. Test Execution: Role-Based Access Control (RBAC)'),
  sectionDivider(),
  para('Test each role with its corresponding account. Priority: Critical'),
  emptyLine(),
  heading2('22.1 Admin Role (uat.tester@test.com)'),
  tcTable([
    tcRow('RBAC-001', 'Admin - Full Access', [
      '1. Log in as Admin',
      '2. Navigate to all pages',
      '3. Try all CRUD operations',
    ], ['Can access: Dashboard, Team, Projects, Admin, Profile, Trash', 'Can create/edit/delete tasks, projects', 'Can manage members, roles, sub-teams']),
    tcRow('RBAC-002', 'Admin - All 12 Permissions', [
      '1. Verify: view_tasks, create_tasks, edit_own_tasks, edit_all_tasks, delete_tasks, manage_projects, manage_sub_teams, invite_members, remove_members, manage_roles, view_admin_panel, full_access',
    ], ['All 12 permissions functional', 'No restrictions on any feature'], true),
  ]),
  emptyLine(),
  heading2('22.2 Member Role (alice.chat@test.com)'),
  tcTable([
    tcRow('RBAC-003', 'Member - Can View Tasks', [
      '1. Log in as Alice (Member)',
      '2. Navigate to Dashboard',
    ], ['Can view assigned tasks', 'Can see projects']),
    tcRow('RBAC-004', 'Member - Can Create Tasks', [
      '1. Try Quick Add to create task',
    ], ['Task creation succeeds'], true),
    tcRow('RBAC-005', 'Member - Can Edit Own Tasks Only', [
      '1. Open a task assigned to Alice',
      '2. Edit title, status, priority',
      '3. Open a task NOT assigned to Alice',
      '4. Try to edit it',
    ], ['Own tasks: edit works', 'Others\' tasks: edit blocked (unless edit_all_tasks permission granted)']),
    tcRow('RBAC-006', 'Member - Cannot Delete Tasks', [
      '1. Try to delete a task',
    ], ['Delete action not available or blocked'], true),
    tcRow('RBAC-007', 'Member - Cannot Access Admin Panel', [
      '1. Try to navigate to /admin',
    ], ['Admin page blocked', 'Redirected or access denied']),
    tcRow('RBAC-008', 'Member - Cannot Manage Projects', [
      '1. Try to create/edit/delete a project',
    ], ['Project management blocked'], true),
  ]),
  emptyLine(),
  heading2('22.3 Viewer Role'),
  para('Note: Set Carol as Viewer role via Admin panel before testing.'),
  tcTable([
    tcRow('RBAC-009', 'Viewer - Read Only', [
      '1. Log in as Carol (set to Viewer)',
      '2. Navigate to Dashboard',
    ], ['Can view tasks', 'Cannot create, edit, or delete anything']),
    tcRow('RBAC-010', 'Viewer - All Write Actions Blocked', [
      '1. Try: Quick Add, edit task, delete task',
      '2. Try: create project, invite member',
    ], ['All write actions blocked', 'Only view_tasks permission active'], true),
    tcRow('RBAC-011', 'Viewer - No Admin Access', [
      '1. Try to access /admin',
    ], ['Blocked or redirected']),
  ]),
  emptyLine(),
  heading2('22.4 Sub-Team Manager Role'),
  para('Note: Set Bob as Sub-Team Manager role via Admin panel before testing.'),
  tcTable([
    tcRow('RBAC-012', 'STM - Can Manage Sub-Teams', [
      '1. Log in as Bob (Sub-Team Manager)',
      '2. Navigate to Admin panel',
    ], ['Can access Admin panel', 'Can create/edit sub-teams']),
    tcRow('RBAC-013', 'STM - Can Edit All Tasks', [
      '1. Open any task (even others\')',
      '2. Edit title, status',
    ], ['Edit succeeds for any task'], true),
    tcRow('RBAC-014', 'STM - Cannot Delete Tasks', [
      '1. Try to delete a task',
    ], ['Delete blocked']),
    tcRow('RBAC-015', 'STM - Cannot Remove Members or Manage Roles', [
      '1. Go to Admin > Members',
      '2. Try to remove a member',
      '3. Try to change someone\'s role',
    ], ['Remove blocked', 'Role change blocked'], true),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 23: MOBILE
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('23. Test Execution: Mobile & Responsive'),
  sectionDivider(),
  para('Test using Chrome DevTools (375x812 iPhone, 390x844 iPhone 14) or physical device. Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('MOB-001', 'Bottom Navigation Bar', [
      '1. Open app at mobile viewport',
      '2. Observe bottom of screen',
    ], ['Bottom nav visible with 5 items: Tasks, Team, Search, Chat, Alerts', 'Icons with labels', 'Fixed at bottom']),
    tcRow('MOB-002', 'Bottom Nav - Tasks', [
      '1. Tap "Tasks" in bottom nav',
    ], ['Navigates to / (My Tasks)', 'Dashboard loads correctly'], true),
    tcRow('MOB-003', 'Bottom Nav - Team', [
      '1. Tap "Team" in bottom nav',
    ], ['Navigates to /team', 'Team Dashboard loads']),
    tcRow('MOB-004', 'Bottom Nav - Search', [
      '1. Tap "Search" in bottom nav',
    ], ['Command palette opens', 'Full-screen on mobile'], true),
    tcRow('MOB-005', 'Bottom Nav - Chat', [
      '1. Tap "Chat" in bottom nav',
    ], ['Chat panel opens', 'Overlays main content']),
    tcRow('MOB-006', 'Bottom Nav - Alerts Badge', [
      '1. Generate notifications',
      '2. Observe Alerts icon',
    ], ['Red badge with unread count', '"9+" if count > 9'], true),
    tcRow('MOB-007', 'Sidebar Hamburger Menu', [
      '1. Tap hamburger icon (top-left)',
    ], ['Sidebar opens as overlay with backdrop', 'Shows all nav items']),
    tcRow('MOB-008', 'Sidebar Close on Tap', [
      '1. With sidebar open, tap a nav item',
    ], ['Sidebar closes', 'Navigates to selected page'], true),
    tcRow('MOB-009', 'List View on Mobile', [
      '1. View tasks in List view',
    ], ['Tasks render with proper padding (p-3)', 'Readable on small screen', 'Bottom padding for nav bar (pb-20)']),
    tcRow('MOB-010', 'Board View on Mobile', [
      '1. Switch to Board view',
    ], ['Columns may scroll horizontally', 'Cards readable', 'Drag-and-drop functional'], true),
    tcRow('MOB-011', 'Calendar View on Mobile', [
      '1. Switch to Calendar view',
    ], ['Calendar renders correctly', 'Task bars visible', 'Navigation arrows work']),
    tcRow('MOB-012', 'Gantt View on Mobile', [
      '1. Switch to Gantt view',
    ], ['Horizontal scroll available', 'Task bars visible', 'Timeline readable'], true),
    tcRow('MOB-013', 'Task Detail on Mobile', [
      '1. Tap any task',
    ], ['Detail panel opens (may overlay)', 'All fields accessible', 'Close button visible']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 24: ERROR HANDLING & EDGE CASES
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('24. Test Execution: Error Handling & Edge Cases'),
  sectionDivider(),
  para('Login as: Various accounts | Priority: High'),
  emptyLine(),
  tcTable([
    tcRow('ERR-001', 'Network Error Handling', [
      '1. Disable network in DevTools',
      '2. Try to create a task',
      '3. Re-enable network',
    ], ['Error toast displayed', 'App does not crash', 'Recovery when network restored']),
    tcRow('ERR-002', 'Empty Task Title', [
      '1. In Quick Add, press Enter with empty input',
    ], ['Task NOT created', 'No empty task appears'], true),
    tcRow('ERR-003', 'Very Long Task Title', [
      '1. Enter a task title with 500+ characters',
    ], ['Task created or truncated gracefully', 'No UI overflow or crash']),
    tcRow('ERR-004', 'Special Characters in Title', [
      '1. Create task with title: <script>alert("xss")</script>',
    ], ['Title saved as plain text', 'No XSS execution', 'Characters displayed safely'], true),
    tcRow('ERR-005', 'Concurrent Editing (Conflict Detection)', [
      '1. Open same task in 2 browser tabs',
      '2. Edit in Tab 1 and save',
      '3. Edit in Tab 2 and save',
    ], ['Tab 2: "This task was modified by someone else"', 'No data loss', 'User prompted to refresh']),
    tcRow('ERR-006', 'Circular Dependency Chain', [
      '1. A depends on B',
      '2. B depends on C',
      '3. Try: C depends on A',
    ], ['BFS detects cycle', 'Error: "circular dependency"', 'Dependency NOT created'], true),
    tcRow('ERR-007', 'Remove Last Admin Protection', [
      '1. As sole admin, try self-removal',
    ], ['Error: "Cannot remove the last admin"', 'Admin preserved']),
    tcRow('ERR-008', 'Demote Last Admin Protection', [
      '1. As sole admin, try changing own role to Member',
    ], ['Error: "Cannot demote the last admin"', 'Role unchanged'], true),
    tcRow('ERR-009', 'Member Removal Cleanup', [
      '1. Assign multiple tasks to Alice',
      '2. Remove Alice from team via Admin',
      '3. Check those tasks',
    ], ['Alice removed from all task assignments automatically', 'Tasks still exist, just unassigned']),
    tcRow('ERR-010', 'Direct URL Access Without Login', [
      '1. Log out',
      '2. Navigate to /team directly',
    ], ['Redirected to login page', 'Protected route not accessible'], true),
    tcRow('ERR-011', 'Invalid Project URL', [
      '1. Navigate to /projects/nonexistent-id',
    ], ['Error handled gracefully', 'Error boundary or redirect', 'No white screen']),
    tcRow('ERR-012', 'RLS - Cross-Team Data Isolation', [
      '1. Create 2 separate teams',
      '2. Log in as user in Team A',
      '3. Try to access Team B\'s data via URL manipulation',
    ], ['Team B data NOT accessible', 'RLS policies enforce isolation'], true),
    tcRow('ERR-013', 'Profile Email Privacy', [
      '1. As Alice, try to access emails of users not on her team',
    ], ['Non-teammate emails not visible', 'Profiles RLS restricts to self + teammates']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 25: PERFORMANCE & REAL-TIME
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('25. Test Execution: Performance & Real-Time'),
  sectionDivider(),
  para('Priority: Medium'),
  emptyLine(),
  tcTable([
    tcRow('PERF-001', 'Page Load Time', [
      '1. Clear cache and hard refresh',
      '2. Navigate to dashboard',
      '3. Measure time to interactive',
    ], ['Page loads within 3 seconds on broadband', 'No blank/white screen', 'Loading skeletons shown during fetch']),
    tcRow('PERF-002', 'Task List Performance', [
      '1. Project with 50+ tasks',
      '2. Switch between views',
    ], ['Views render smoothly', 'No visible lag or jank', 'Scroll is smooth'], true),
    tcRow('PERF-003', 'Real-Time Chat Latency', [
      '1. Send message between 2 users',
      '2. Measure delivery time',
    ], ['Message delivered within 1-2 seconds', 'No polling delay']),
    tcRow('PERF-004', 'Real-Time Notification Latency', [
      '1. Trigger notification event',
      '2. Observe target user\'s bell',
    ], ['Notification appears within 1-2 seconds', 'Badge updates instantly'], true),
    tcRow('PERF-005', 'Optimistic Update UX', [
      '1. Change task status',
      '2. Observe UI response',
    ], ['UI updates INSTANTLY (before server response)', 'Rollback on error']),
    tcRow('PERF-006', 'Subscription Cleanup', [
      '1. Navigate between pages rapidly',
      '2. Open/close chat multiple times',
      '3. Check browser DevTools console',
    ], ['No memory leak warnings', 'No duplicate subscriptions', 'Subscriptions properly cleaned up on unmount'], true),
    tcRow('PERF-007', 'Loading Skeletons', [
      '1. Throttle network in DevTools',
      '2. Navigate to Dashboard',
    ], ['Loading skeletons visible during data fetch', 'Replaced by actual content once loaded']),
    tcRow('PERF-008', 'WCAG AA Contrast', [
      '1. Use accessibility audit tool (Lighthouse/axe)',
      '2. Check text contrast ratios',
    ], ['All text meets WCAG AA contrast (4.5:1 minimum)', 'No critical contrast failures'], true),
    tcRow('PERF-009', 'ARIA Labels Present', [
      '1. Inspect interactive elements in DevTools',
      '2. Check for aria-label attributes',
    ], ['Buttons, icons, inputs have ARIA labels', 'Screen reader can identify all controls']),
  ]),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// SECTION 26: SIGN-OFF
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('26. UAT Sign-Off Sheet'),
  sectionDivider(),
  heading2('26.1 Test Summary'),
);

const sumColW = [4000, 6080];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: sumColW,
    rows: [
      new TableRow({ children: [headerCell('Metric', sumColW[0]), headerCell('Value', sumColW[1])] }),
      ...['Total Test Cases', 'Passed', 'Failed', 'Blocked', 'Not Executed',
        'Pass Rate (%)', 'Critical Defects Open', 'High Defects Open',
        'Medium Defects Open', 'Low Defects Open'
      ].map((m, i) => new TableRow({
        children: [
          cell(m, sumColW[0], { bold: true, shading: i % 2 ? COLOR_ALT_ROW : undefined }),
          cell('', sumColW[1], { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
        ]
      }))
    ]
  }),
  emptyLine(),
  heading2('26.2 Sign-Off Approvals'),
);

const signColW = [2200, 2200, 2800, 2880];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: signColW,
    rows: [
      new TableRow({ children: [
        headerCell('Role', signColW[0]),
        headerCell('Name', signColW[1]),
        headerCell('Signature / Approval', signColW[2]),
        headerCell('Date', signColW[3]),
      ]}),
      ...['QA Lead', 'QA Engineer', 'Release Manager', 'Engineering Manager', 'Product Manager'].map((r, i) => new TableRow({
        children: [
          cell(r, signColW[0], { bold: true, shading: i % 2 ? COLOR_ALT_ROW : undefined }),
          cell('', signColW[1], { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
          cell('', signColW[2], { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
          cell('', signColW[3], { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
        ]
      }))
    ]
  }),
  emptyLine(),
  heading2('26.3 Go / No-Go Decision'),
  emptyLine(),
);

const decColW = [5040, 5040];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: decColW,
    rows: [
      new TableRow({ children: [
        cell('GO - Approved for Production Release', decColW[0], { bold: true, shading: 'D5F5E3' }),
        cell('NO-GO - Issues Must Be Resolved', decColW[1], { bold: true, shading: 'FADBD8' }),
      ]}),
      new TableRow({ children: [
        cell('', decColW[0]),
        cell('', decColW[1]),
      ]}),
    ]
  }),
  emptyLine(),
  boldPara('Decision: ', '_________________________________'),
  boldPara('Approved By: ', '_________________________________'),
  boldPara('Date: ', '_________________________________'),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// APPENDIX A
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('Appendix A: Defect Report Template'),
  sectionDivider(),
);

const defColW = [2600, 7480];
const defectFields = [
  ['Defect ID', 'BUG-XXX'],
  ['Related TC ID', '(e.g., AUTH-003)'],
  ['Title', '(Short descriptive title)'],
  ['Severity', 'Critical / High / Medium / Low'],
  ['Status', 'New / Assigned / In Progress / Fixed / Verified / Closed / Reopened'],
  ['Reported By', '(Name)'],
  ['Reported Date', '(Date)'],
  ['Assigned To', '(Developer name)'],
  ['Environment', '(Browser, OS, viewport)'],
  ['Steps to Reproduce', '1. ... 2. ... 3. ...'],
  ['Expected Result', '(What should happen)'],
  ['Actual Result', '(What actually happened)'],
  ['Screenshot / Video', '(Attach evidence)'],
  ['Notes', '(Additional context, workarounds)'],
];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: defColW,
    rows: defectFields.map(([k, v], i) => new TableRow({
      children: [
        cell(k, defColW[0], { bold: true, shading: COLOR_HEADER_BG }),
        cell(v, defColW[1], { shading: i % 2 ? COLOR_ALT_ROW : undefined }),
      ]
    }))
  }),
  pageBreak()
);

// ════════════════════════════════════════════════════════════════
// APPENDIX B
// ════════════════════════════════════════════════════════════════
children.push(
  heading1('Appendix B: Test Summary Report Template'),
  sectionDivider(),
  heading2('B.1 Executive Summary'),
  para('(Brief overview of UAT cycle, dates, team, key findings)'),
  emptyLine(),
  heading2('B.2 Test Execution Summary by Module'),
);

const modColW = [2600, 1400, 1200, 1200, 1200, 1200, 1280];
children.push(
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: modColW,
    rows: [
      new TableRow({ children: [
        headerCell('Module', modColW[0]),
        headerCell('Total TCs', modColW[1]),
        headerCell('Passed', modColW[2]),
        headerCell('Failed', modColW[3]),
        headerCell('Blocked', modColW[4]),
        headerCell('Not Run', modColW[5]),
        headerCell('Pass %', modColW[6]),
      ]}),
      ...['Authentication', 'Dashboard', 'Projects', 'Task Creation', 'Task Views',
        'Task Details', 'Filters & Sort', 'Bulk Actions', 'Team Dashboard',
        'Chat', 'Notifications', 'Search & Shortcuts', 'Admin Panel',
        'Profile & Settings', 'Trash', 'RBAC', 'Mobile', 'Error Handling', 'Performance'
      ].map((m, i) => new TableRow({
        children: modColW.map((w, j) => cell(j === 0 ? m : '', w, { shading: i % 2 ? COLOR_ALT_ROW : undefined, bold: j === 0 }))
      })),
      new TableRow({ children: [
        cell('TOTAL', modColW[0], { bold: true, shading: COLOR_HEADER_BG }),
        ...modColW.slice(1).map(w => cell('', w, { bold: true, shading: COLOR_HEADER_BG })),
      ]}),
    ]
  }),
  emptyLine(),
  heading2('B.3 Defect Summary'),
  para('(Table of all defects found, grouped by severity, with resolution status)'),
  emptyLine(),
  heading2('B.4 Risks & Recommendations'),
  para('(Any known risks, deferred issues, recommendations for future testing)'),
  emptyLine(),
  heading2('B.5 Conclusion'),
  para('(Final assessment: ready for production or requires additional work)'),
  emptyLine(), emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_ACCENT, space: 12 } },
    children: [new TextRun({ text: 'END OF UAT MANUAL', font: FONT, size: 24, bold: true, color: COLOR_PRIMARY })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Team Task Manager  |  Version 1.0  |  March 2026', font: FONT, size: 20, color: '888888' })]
  }),
);

// ── Build Document ────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 20 } }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: COLOR_ACCENT },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ]
      },
      {
        reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]
      },
      {
        reference: 'steps',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: 15840 },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_ACCENT, space: 6 } },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: 'Team Task Manager  |  UAT Manual', font: FONT, size: 16, color: '888888' }),
            new TextRun({ text: '\tVersion 1.0', font: FONT, size: 16, color: '888888' }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER, space: 6 } },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: 'Confidential', font: FONT, size: 14, color: '999999', italics: true }),
            new TextRun({ text: '\tPage ', font: FONT, size: 14, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 14, color: '999999' }),
          ]
        })]
      })
    },
    children
  }]
});

// ── Generate ──────────────────────────────────────────────────
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('Team-Task-Manager-UAT-Manual.docx', buffer);
console.log('UAT Manual generated: Team-Task-Manager-UAT-Manual.docx');
console.log(`Total test cases: ~130+`);
