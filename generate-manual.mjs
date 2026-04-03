/**
 * Generate a comprehensive user manual for Team Task Manager as a .docx file.
 * Uses Playwright for screenshots and docx-js for document generation.
 * Run: node generate-manual.mjs
 */
import { chromium } from 'playwright';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, TabStopType, TabStopPosition,
} from 'docx';
import fs from 'fs';
import path from 'path';

const BASE = 'https://task-manager-eight-vert-91.vercel.app';
const EMAIL = 'uat.tester@test.com';
const PASS = 'UatTest123!';
const SS_DIR = path.join(process.cwd(), 'manual-screenshots');

if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, font: 'Calibri', size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24 })] });
}
function para(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: 'Calibri', size: 22, ...opts })] });
}
function bold(text) { return new TextRun({ text, bold: true, font: 'Calibri', size: 22 }); }
function normal(text) { return new TextRun({ text, font: 'Calibri', size: 22 }); }
function multiRun(...runs) { return new Paragraph({ spacing: { after: 120 }, children: runs }); }
function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 720 * (level + 1), hanging: 360 },
    children: [new TextRun({ text: '\u2022  ', font: 'Calibri', size: 22 }), new TextRun({ text, font: 'Calibri', size: 22 })],
  });
}
function numberedStep(num, text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 720, hanging: 360 },
    children: [new TextRun({ text: `${num}.  `, bold: true, font: 'Calibri', size: 22, color: '4F46E5' }), new TextRun({ text, font: 'Calibri', size: 22 })],
  });
}
function imageBlock(imgPath, w, h, title) {
  const buf = fs.readFileSync(imgPath);
  const children = [
    new Paragraph({
      spacing: { before: 150, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ type: 'png', data: buf, transformation: { width: w, height: h }, altText: { title, description: title, name: title } })],
    }),
    new Paragraph({ spacing: { after: 150 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, italics: true, font: 'Calibri', size: 18, color: '6B7280' })] }),
  ];
  return children;
}
function divider() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB', space: 1 } }, children: [] });
}

// ─── Screenshot Capture ───────────────────────────────────────────────
async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login
  console.log('Logging in...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check if already logged in
  const url = page.url();
  if (url.includes('login') || await page.locator('input[type="email"]').count() > 0) {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(2000);

  const shots = {};
  async function snap(name, waitMs = 1500) {
    await page.waitForTimeout(waitMs);
    const p = path.join(SS_DIR, `${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    shots[name] = p;
    console.log(`  Screenshot: ${name}`);
  }

  // 1. Dashboard - List View (default)
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await snap('dashboard_list', 3000);

  // 2. Dashboard - Board View
  const boardBtn = page.locator('button:has-text("Board")').first();
  if (await boardBtn.count()) { await boardBtn.click(); await snap('dashboard_board', 2000); }

  // 3. Dashboard - Calendar View
  const calBtn = page.locator('button:has-text("Calendar")').first();
  if (await calBtn.count()) { await calBtn.click(); await snap('dashboard_calendar', 2000); }

  // 4. Dashboard - Gantt View
  const ganttBtn = page.locator('button:has-text("Gantt")').first();
  if (await ganttBtn.count()) { await ganttBtn.click(); await snap('dashboard_gantt', 2000); }

  // 5. Switch back to list, click a task to open detail
  const listBtn = page.locator('button:has-text("List")').first();
  if (await listBtn.count()) await listBtn.click();
  await page.waitForTimeout(1000);
  const taskRow = page.locator('[class*="cursor-pointer"]').filter({ hasText: /pipeline|mockup|migration|unit|API|asdf/i }).first();
  if (await taskRow.count()) { await taskRow.click(); await snap('task_detail', 2000); }
  // Close detail
  const closeBtn = page.locator('button[title="Close"]').first();
  if (await closeBtn.count()) await closeBtn.click();

  // 6. Project Page
  const projectLink = page.locator('text=General').first();
  if (await projectLink.count()) { await projectLink.click(); await snap('project_page', 3000); }

  // 7. Team Dashboard
  const teamLink = page.locator('text=Team Dashboard').first();
  if (await teamLink.count()) { await teamLink.click(); await snap('team_dashboard', 3000); }

  // 8. Admin Panel
  const adminLink = page.locator('text=Admin Panel').first();
  if (await adminLink.count()) { await adminLink.click(); await snap('admin_panel', 3000); }

  // 9. Chat Panel - open via header button
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const chatToggle = page.locator('button[title="Toggle chat panel"]').first();
  if (await chatToggle.count()) { await chatToggle.click(); await snap('chat_panel', 2000); }
  // Close chat
  if (await chatToggle.count()) await chatToggle.click();

  // 10. Profile Page
  await page.goto(BASE + '/profile', { waitUntil: 'networkidle' });
  await snap('profile_page', 2000);

  // 11. Trash Page
  await page.goto(BASE + '/trash', { waitUntil: 'networkidle' });
  await snap('trash_page', 2000);

  // 12. Search / Command Palette
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(1000);
  await snap('search_palette', 1000);
  await page.keyboard.press('Escape');

  // 13. Login page
  // We'll use a fresh incognito context
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(2000);
  const loginPath = path.join(SS_DIR, 'login_page.png');
  await page2.screenshot({ path: loginPath });
  shots['login_page'] = loginPath;
  console.log('  Screenshot: login_page');
  await ctx2.close();

  await browser.close();
  console.log(`Done! ${Object.keys(shots).length} screenshots captured.`);
  return shots;
}

// ─── Document Generation ──────────────────────────────────────────────
function generateManual(shots) {
  console.log('Generating .docx manual...');

  const s = (name, w = 560, h = 350) => {
    if (shots[name]) return imageBlock(shots[name], w, h, name.replace(/_/g, ' '));
    return [];
  };

  const border = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  function cell(text, opts = {}) {
    return new TableCell({
      borders,
      width: { size: opts.width || 2340, type: WidthType.DXA },
      shading: opts.header ? { fill: '4F46E5', type: ShadingType.CLEAR } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 20, bold: !!opts.header, color: opts.header ? 'FFFFFF' : '374151' })] })],
    });
  }

  const children = [
    // ══════════ COVER PAGE ══════════
    new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Team Task Manager', font: 'Calibri', size: 56, bold: true, color: '4F46E5' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Complete User Manual', font: 'Calibri', size: 32, color: '6B7280' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Version 1.2 \u2014 April 2026', font: 'Calibri', size: 22, color: '9CA3AF' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'A simple, intuitive task management tool', font: 'Calibri', size: 24, italics: true, color: '6B7280' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'for teams that don\u2019t want complex PM software.', font: 'Calibri', size: 24, italics: true, color: '6B7280' })] }),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ TABLE OF CONTENTS ══════════
    heading('Table of Contents'),
    para('1.  Getting Started \u2014 Sign up, log in, create your team'),
    para('2.  The Dashboard \u2014 Your personal task hub'),
    para('3.  Projects \u2014 Organize work into projects'),
    para('4.  Creating Tasks \u2014 Add tasks quickly'),
    para('5.  Task Views \u2014 List, Board, Calendar, Gantt'),
    para('6.  Task Details \u2014 Edit, assign, comment, track'),
    para('7.  Filters & Sorting \u2014 Find what you need'),
    para('8.  Bulk Actions \u2014 Work with multiple tasks at once'),
    para('9.  Team Dashboard \u2014 See everyone\u2019s work'),
    para('10. Chat \u2014 Talk to your team'),
    para('11. Notifications \u2014 Stay in the loop'),
    para('12. Search & Shortcuts \u2014 Navigate fast'),
    para('13. Admin Panel \u2014 Manage your team'),
    para('14. Profile & Settings \u2014 Customize your experience'),
    para('15. Trash \u2014 Recover deleted tasks'),
    para('16. Tips & Tricks \u2014 Get the most out of the tool'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 1: GETTING STARTED ══════════
    heading('1. Getting Started'),
    para('Team Task Manager is a web app that helps your team keep track of tasks, deadlines, and projects. Think of it like a shared to-do list, but much more powerful. Here\u2019s how to get started.'),
    divider(),

    heading('1.1 Creating Your Account', HeadingLevel.HEADING_2),
    numberedStep(1, 'Open your web browser (Chrome, Firefox, Safari, or Edge).'),
    numberedStep(2, 'Go to the app URL your team admin shared with you.'),
    numberedStep(3, 'Click "Sign Up" at the bottom of the login form.'),
    numberedStep(4, 'Type your full name, email address, and a password (at least 6 characters).'),
    numberedStep(5, 'Click the "Sign Up" button.'),
    numberedStep(6, 'You\u2019re in! You\u2019ll land on the My Tasks dashboard.'),
    ...s('login_page', 500, 310),

    heading('1.2 Logging In', HeadingLevel.HEADING_2),
    numberedStep(1, 'Go to the app URL.'),
    numberedStep(2, 'Type your email and password.'),
    numberedStep(3, 'Click "Log In". That\u2019s it!'),

    heading('1.3 Joining a Team', HeadingLevel.HEADING_2),
    para('Your team admin needs to invite you. Once they add your email, the team will appear automatically when you log in. If you don\u2019t see a team, ask your admin to invite you from the Admin Panel.'),

    heading('1.4 Creating a New Team', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click the team name dropdown at the top-left of the sidebar.'),
    numberedStep(2, 'Click "New Team" at the bottom.'),
    numberedStep(3, 'Give your team a name (like "Marketing Team" or "Class Project").'),
    numberedStep(4, 'Click Create. A default "General" project is created for you automatically.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 2: THE DASHBOARD ══════════
    heading('2. The Dashboard (My Tasks)'),
    para('This is your home screen. It shows every task assigned to you, across all projects. When you log in, this is what you see first.'),
    ...s('dashboard_list', 560, 340),

    heading('2.1 What\u2019s on the Screen', HeadingLevel.HEADING_2),
    bullet('Sidebar (left) \u2014 Navigate between pages, projects, and team tools.'),
    bullet('Header (top) \u2014 Search, change theme, see notifications, and open chat.'),
    bullet('View Tabs \u2014 Switch between List, Board, Calendar, and Gantt views.'),
    bullet('Filters \u2014 Narrow down tasks by status, priority, who\u2019s assigned, and more.'),
    bullet('Sort dropdown \u2014 Change how tasks are ordered (by due date, priority, title, etc.).'),
    bullet('Quick Add bar \u2014 Type a task name and press Enter to create it instantly.'),
    bullet('Task list \u2014 Your tasks grouped by status (To Do, In Progress, On Hold, Done).'),

    heading('2.2 Welcome Guide', HeadingLevel.HEADING_2),
    para('If you\u2019re new, you\u2019ll see a Welcome Guide with 3 steps: Join a Team, Create a Project, and Add a Task. Complete all three and the guide disappears. You can also click "Dismiss" to hide it.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 3: PROJECTS ══════════
    heading('3. Projects'),
    para('Projects are like folders for your tasks. You might have a project called "Website Redesign" or "Homework". Every task belongs to a project.'),
    ...s('project_page', 560, 340),

    heading('3.1 Creating a Project', HeadingLevel.HEADING_2),
    numberedStep(1, 'In the sidebar, find the "PROJECTS" section.'),
    numberedStep(2, 'Click the + button next to the word "Projects".'),
    numberedStep(3, 'Give it a name (e.g., "Science Fair").'),
    numberedStep(4, 'Pick an emoji (optional but fun!).'),
    numberedStep(5, 'Set start and end dates.'),
    numberedStep(6, 'Click Create.'),

    heading('3.2 What You See in a Project', HeadingLevel.HEADING_2),
    bullet('Project name with emoji at the top.'),
    bullet('Status badge (Not Started, In Progress, On Hold, Completed, Overdue).'),
    bullet('Progress bar showing what percentage of tasks are done.'),
    bullet('Date range (when the project starts and ends).'),
    bullet('All 4 views (List, Board, Calendar, Gantt) \u2014 same as dashboard.'),
    bullet('Templates button \u2014 save and reuse task templates.'),

    heading('3.3 Sidebar Navigation', HeadingLevel.HEADING_2),
    para('Your projects show up in the left sidebar. If you have more than 5 projects, only the first 5 are shown. Click "Show all" to see the rest, or "Show less" to collapse them.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 4: CREATING TASKS ══════════
    heading('4. Creating Tasks'),
    para('Tasks are the things you need to do. Here are all the ways to create them.'),

    heading('4.1 Quick Add (Fastest Way)', HeadingLevel.HEADING_2),
    numberedStep(1, 'Find the Quick Add bar \u2014 it\u2019s the dashed-border box with "+ Add a task...".'),
    numberedStep(2, 'If you\u2019re on the Dashboard, click "Select Project" first to choose which project.'),
    numberedStep(3, 'Type the task name (e.g., "Buy poster board").'),
    numberedStep(4, 'Press Enter. Done! The task is created with default dates and priority.'),

    heading('4.2 Calendar Click-to-Create (Project Page Only)', HeadingLevel.HEADING_2),
    numberedStep(1, 'Switch to Calendar view in a project.'),
    numberedStep(2, 'Click on any date in the calendar.'),
    numberedStep(3, 'A small form appears below the calendar with that date pre-filled.'),
    numberedStep(4, 'Type the task name and click "Add".'),

    heading('4.3 From Templates', HeadingLevel.HEADING_2),
    numberedStep(1, 'In a Project page, click the "Templates" button.'),
    numberedStep(2, 'Pick a saved template and click "Use".'),
    numberedStep(3, 'A new task is created with the template\u2019s title and description.'),
    para('To save a template: click "Create Template", fill in the name, title, and description, then click Save.'),

    heading('4.4 Sub-Tasks', HeadingLevel.HEADING_2),
    para('You can break a big task into smaller steps called sub-tasks (up to 2 levels deep).'),
    numberedStep(1, 'Click on a task to open the Task Detail panel.'),
    numberedStep(2, 'Scroll down to the "Sub-tasks" section.'),
    numberedStep(3, 'Type the sub-task name in the add bar and press Enter.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 5: TASK VIEWS ══════════
    heading('5. Task Views'),
    para('There are 4 different ways to look at your tasks. Switch between them using the tabs at the top.'),

    heading('5.1 List View', HeadingLevel.HEADING_2),
    para('The default view. Tasks are shown in rows, grouped by status (To Do, In Progress, On Hold, Done). Each row shows:'),
    bullet('Priority dot (colored circle: red = urgent, orange = high, yellow = medium, gray = low)'),
    bullet('Task title (click to open details)'),
    bullet('Status badge'),
    bullet('Assignee avatars'),
    bullet('Due date (turns red if overdue!)'),
    bullet('Sub-task count (e.g., "2/5" means 2 of 5 sub-tasks are done)'),
    bullet('Checkbox (for bulk selection)'),
    ...s('dashboard_list', 560, 340),

    heading('5.2 Board View (Kanban)', HeadingLevel.HEADING_2),
    para('Tasks appear as cards in columns. Each column is a status. Drag a card from one column to another to change its status.'),
    bullet('4 columns: To Do, In Progress, On Hold, Done'),
    bullet('Each card shows title, priority dot, due date, assignees, project tag'),
    bullet('Drag and drop to move tasks between columns'),
    ...s('dashboard_board', 560, 340),

    heading('5.3 Calendar View', HeadingLevel.HEADING_2),
    para('See your tasks on a monthly or weekly calendar. Tasks show as colored bars based on priority.'),
    bullet('Red bars = Urgent, Orange = High, Yellow = Medium, Gray = Low'),
    bullet('Click a task bar to open its details'),
    bullet('Use arrows to go to previous/next month'),
    bullet('Click "today" to jump back to the current date'),
    bullet('In a Project page, click an empty date to create a task on that day'),
    ...s('dashboard_calendar', 560, 340),

    heading('5.4 Gantt View', HeadingLevel.HEADING_2),
    para('A timeline chart showing when tasks start and end. Great for seeing how tasks overlap and depend on each other.'),
    bullet('Left side: task names (click to open details)'),
    bullet('Right side: horizontal bars showing duration'),
    bullet('Red vertical line = today'),
    bullet('Arrows between bars = dependencies (which tasks block other tasks)'),
    bullet('Colors: gray = to do, blue = in progress, amber = on hold, green = done'),
    ...s('dashboard_gantt', 560, 340),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 6: TASK DETAILS ══════════
    heading('6. Task Details'),
    para('Click any task to open the Task Detail panel on the right side of the screen. Here you can edit everything about the task.'),
    ...s('task_detail', 560, 340),

    heading('6.1 Fields You Can Edit', HeadingLevel.HEADING_2),

    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2500, 6860],
      rows: [
        new TableRow({ children: [cell('Field', { header: true, width: 2500 }), cell('What It Does', { header: true, width: 6860 })] }),
        new TableRow({ children: [cell('Title', { width: 2500 }), cell('The name of the task. Click to edit, it saves when you click away.', { width: 6860 })] }),
        new TableRow({ children: [cell('Status', { width: 2500 }), cell('Where the task is: To Do, In Progress, On Hold, or Done.', { width: 6860 })] }),
        new TableRow({ children: [cell('Priority', { width: 2500 }), cell('How important: Urgent (1), High (2), Medium (3), or Low (4).', { width: 6860 })] }),
        new TableRow({ children: [cell('Start Date', { width: 2500 }), cell('When work begins. Click the date to change it.', { width: 6860 })] }),
        new TableRow({ children: [cell('End Date', { width: 2500 }), cell('The deadline. Must be on or after the start date.', { width: 6860 })] }),
        new TableRow({ children: [cell('Description', { width: 2500 }), cell('Extra notes or instructions. Supports multiple lines.', { width: 6860 })] }),
        new TableRow({ children: [cell('Assignees', { width: 2500 }), cell('Who is working on it. Each person is Primary (main) or Secondary (helper).', { width: 6860 })] }),
        new TableRow({ children: [cell('Recurrence', { width: 2500 }), cell('Make it repeat: daily, weekly (pick days), or monthly.', { width: 6860 })] }),
        new TableRow({ children: [cell('Dependencies', { width: 2500 }), cell('Which tasks must finish before this one can start.', { width: 6860 })] }),
        new TableRow({ children: [cell('Sub-tasks', { width: 2500 }), cell('Smaller steps inside the task. Up to 2 levels deep.', { width: 6860 })] }),
        new TableRow({ children: [cell('Comments', { width: 2500 }), cell('Leave messages for your team. Everyone assigned can see them.', { width: 6860 })] }),
      ],
    }),

    heading('6.2 Assigning People', HeadingLevel.HEADING_2),
    numberedStep(1, 'In the Task Detail panel, find the "Assignees" section.'),
    numberedStep(2, 'Click the + button to see available team members.'),
    numberedStep(3, 'Click "Primary" or "Secondary" next to a person\u2019s name.'),
    para('Primary = the main person responsible. Secondary = a helper or reviewer.'),
    numberedStep(4, 'To remove someone, click the X next to their name.'),
    numberedStep(5, 'To switch roles, click the P/S button next to their name.'),

    heading('6.3 Adding Dependencies', HeadingLevel.HEADING_2),
    para('Dependencies mean "this task can\u2019t start until that other task is done."'),
    numberedStep(1, 'In the Task Detail panel, find the "Dependencies" section.'),
    numberedStep(2, 'Click "+ Add dependency".'),
    numberedStep(3, 'Search for the blocking task and click it.'),
    para('The app prevents circular dependencies (e.g., Task A blocks B and B blocks A). You\u2019ll see an error if you try.'),

    heading('6.4 Comments', HeadingLevel.HEADING_2),
    numberedStep(1, 'Scroll to the bottom of the Task Detail panel.'),
    numberedStep(2, 'Type your message in the "Write a comment..." box.'),
    numberedStep(3, 'Click the send button (arrow icon).'),
    para('You can delete your own comments by clicking the trash icon.'),

    heading('6.5 Duplicate & Delete', HeadingLevel.HEADING_2),
    bullet('Duplicate: Click the copy icon in the Task Detail header. Creates a copy with "(copy)" in the title.'),
    bullet('Delete: Click the trash icon. The task moves to Trash (not permanently deleted yet).'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 7: FILTERS & SORTING ══════════
    heading('7. Filters & Sorting'),
    para('Use the filter bar at the top of any view to narrow down what you see.'),

    heading('7.1 Available Filters', HeadingLevel.HEADING_2),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2500, 6860],
      rows: [
        new TableRow({ children: [cell('Filter', { header: true, width: 2500 }), cell('What It Does', { header: true, width: 6860 })] }),
        new TableRow({ children: [cell('Search', { width: 2500 }), cell('Type to find tasks by name. Works instantly as you type.', { width: 6860 })] }),
        new TableRow({ children: [cell('Status', { width: 2500 }), cell('Show only tasks with a specific status (e.g., only "In Progress").', { width: 6860 })] }),
        new TableRow({ children: [cell('Priority', { width: 2500 }), cell('Show only tasks with a specific priority level.', { width: 6860 })] }),
        new TableRow({ children: [cell('Role', { width: 2500 }), cell('On My Tasks: show only tasks where you are Primary or Secondary.', { width: 6860 })] }),
        new TableRow({ children: [cell('Assignee', { width: 2500 }), cell('On Team/Project pages: show only tasks assigned to a specific person.', { width: 6860 })] }),
        new TableRow({ children: [cell('Sort', { width: 2500 }), cell('Change the order: Manual, Due date, Priority, Title, or Created date.', { width: 6860 })] }),
      ],
    }),
    para('Click "Clear" (the X button) to remove all filters at once.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 8: BULK ACTIONS ══════════
    heading('8. Bulk Actions'),
    para('Need to update many tasks at once? Use bulk actions.'),

    heading('8.1 How to Use', HeadingLevel.HEADING_2),
    numberedStep(1, 'In List view, click the checkbox next to each task you want to select.'),
    numberedStep(2, 'A toolbar appears at the bottom of the screen showing how many tasks are selected.'),
    numberedStep(3, 'Choose an action from the toolbar:'),
    bullet('Change Status \u2014 Click any status button (To Do, In Progress, On Hold, Done).'),
    bullet('Set Priority \u2014 Click "Priority" and pick Urgent, High, Medium, or Low.'),
    bullet('Assign \u2014 Click "Assign" and pick a team member.'),
    bullet('Shift Dates \u2014 Click "Shift Dates" to move all selected tasks\u2019 dates:'),
    bullet('Quick options: -7 days, -1 day, +1 day, +7 days', 1),
    bullet('Custom: type any number of days and click "Go"', 1),
    bullet('Delete \u2014 Moves all selected tasks to Trash.'),
    numberedStep(4, 'Click X to deselect all.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 9: TEAM DASHBOARD ══════════
    heading('9. Team Dashboard'),
    para('See a bird\u2019s-eye view of everything your team is working on.'),
    ...s('team_dashboard', 560, 340),

    heading('9.1 What You See', HeadingLevel.HEADING_2),
    bullet('Team name at the top.'),
    bullet('4 stat cards: Total Tasks, In Progress, Overdue, Done This Week.'),
    bullet('All tasks from every project in the team.'),
    bullet('Same 4 views (List, Board, Calendar, Gantt).'),
    bullet('Filters with an extra "Assignee" dropdown to see a specific person\u2019s tasks.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 10: CHAT ══════════
    heading('10. Chat'),
    para('Talk to your teammates without leaving the app.'),
    ...s('chat_panel', 560, 340),

    heading('10.1 Opening Chat', HeadingLevel.HEADING_2),
    bullet('Desktop: Click the chat bubble icon in the top-right corner of the header.'),
    bullet('Mobile: Tap "Chat" in the bottom navigation bar.'),
    para('Note: When you open Chat, the Task Detail panel closes automatically (and vice versa). They don\u2019t overlap.'),

    heading('10.2 Starting a Conversation', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click the + button at the top of the chat panel.'),
    numberedStep(2, 'Choose Direct (one-on-one) or Group.'),
    numberedStep(3, 'For Direct: pick a team member from the list.'),
    numberedStep(4, 'For Group: name the group, select members, click "Create Group".'),

    heading('10.3 Sending Messages', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click a conversation from the list.'),
    numberedStep(2, 'Type your message in the box at the bottom.'),
    numberedStep(3, 'Press Enter or click the send button.'),
    para('Messages update in real-time \u2014 no need to refresh!'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 11: NOTIFICATIONS ══════════
    heading('11. Notifications'),
    para('The app sends you notifications when important things happen.'),

    heading('11.1 What Triggers a Notification', HeadingLevel.HEADING_2),
    bullet('Someone assigns a task to you.'),
    bullet('Someone comments on a task you\u2019re assigned to.'),
    bullet('A task\u2019s status changes (e.g., from "In Progress" to "Done").'),

    heading('11.2 Viewing Notifications', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click the bell icon in the header (top-right).'),
    numberedStep(2, 'A dropdown shows your recent notifications.'),
    numberedStep(3, 'The red badge shows how many unread notifications you have.'),
    numberedStep(4, 'Click a notification to mark it as read and go to the related task.'),

    heading('11.3 Notification Settings', HeadingLevel.HEADING_2),
    para('Go to Profile > Notification Preferences to:'),
    bullet('Turn on/off notifications for: Task assigned, New comment, Status changed.'),
    bullet('Set "Quiet Hours" \u2014 a time range when notifications are silenced.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 12: SEARCH & SHORTCUTS ══════════
    heading('12. Search & Keyboard Shortcuts'),
    ...s('search_palette', 560, 340),

    heading('12.1 Global Search (Command Palette)', HeadingLevel.HEADING_2),
    numberedStep(1, 'Press Ctrl+K (or \u2318+K on Mac) from anywhere in the app.'),
    numberedStep(2, 'A search box appears in the center of the screen.'),
    numberedStep(3, 'Type to search for tasks by name.'),
    numberedStep(4, 'Use arrow keys to navigate results, Enter to open.'),
    para('You\u2019ll also see Quick Actions: create a new task, toggle dark mode, go to settings, or go to trash.'),

    heading('12.2 Keyboard Shortcuts', HeadingLevel.HEADING_2),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [
        new TableRow({ children: [cell('Shortcut', { header: true, width: 3000 }), cell('What It Does', { header: true, width: 6360 })] }),
        new TableRow({ children: [cell('Ctrl + K  or  /', { width: 3000 }), cell('Open search / command palette', { width: 6360 })] }),
        new TableRow({ children: [cell('N', { width: 3000 }), cell('Create a new task', { width: 6360 })] }),
        new TableRow({ children: [cell('1', { width: 3000 }), cell('Switch to List view', { width: 6360 })] }),
        new TableRow({ children: [cell('2', { width: 3000 }), cell('Switch to Board view', { width: 6360 })] }),
        new TableRow({ children: [cell('3', { width: 3000 }), cell('Switch to Calendar view', { width: 6360 })] }),
        new TableRow({ children: [cell('4', { width: 3000 }), cell('Switch to Gantt view', { width: 6360 })] }),
        new TableRow({ children: [cell('?', { width: 3000 }), cell('Show all keyboard shortcuts', { width: 6360 })] }),
        new TableRow({ children: [cell('Esc', { width: 3000 }), cell('Close any open panel or modal', { width: 6360 })] }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 13: ADMIN PANEL ══════════
    heading('13. Admin Panel'),
    para('Only team admins can access this page. It\u2019s where you manage your team.'),
    ...s('admin_panel', 560, 340),

    heading('13.1 Members Tab', HeadingLevel.HEADING_2),
    para('See everyone on your team. For each member you can:'),
    bullet('Change their role: Admin, Sub-Team Manager, Member, or Viewer.'),
    bullet('Set custom permissions (12 toggleable permissions like "can create tasks", "can delete tasks", etc.).'),
    bullet('Remove them from the team (their tasks get unassigned automatically).'),
    para('Important: You cannot remove or demote the last admin. There must always be at least one admin.'),

    heading('13.2 Sub-Teams Tab', HeadingLevel.HEADING_2),
    para('Create smaller groups within your team (like "Design Team" or "Group A").'),
    numberedStep(1, 'Click "New Sub-Team".'),
    numberedStep(2, 'Give it a name.'),
    numberedStep(3, 'Use the dropdown to add members.'),
    numberedStep(4, 'Click X on a member pill to remove them.'),

    heading('13.3 Settings Tab', HeadingLevel.HEADING_2),
    para('Change your team\u2019s name and description. Click "Save Changes" when done.'),

    heading('13.4 Inviting New Members', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click "Invite Member" in the sidebar.'),
    numberedStep(2, 'Enter the person\u2019s email address (they must already have an account).'),
    numberedStep(3, 'Click "Invite". They\u2019re added as a Member by default.'),

    heading('13.5 Permissions & What Each Role Can Do', HeadingLevel.HEADING_2),
    para('Permissions are enforced both in the database and in the UI. Here\u2019s what each role can do by default:'),
    bullet('Admin \u2014 Full access to everything. Can manage members, change settings, and delete any task.'),
    bullet('Sub-Team Manager \u2014 Can edit all tasks and manage their sub-team\u2019s members.'),
    bullet('Member \u2014 Can create tasks and edit their own tasks. Cannot delete tasks or manage members.'),
    bullet('Viewer \u2014 Read-only access. Cannot create, edit, or delete tasks. The quick-add input and action buttons are hidden.'),
    para('Admins can customize any member\u2019s permissions individually from the Members tab using the 12 permission toggles.'),
    para('The 12 permissions are: create tasks, edit own tasks, edit all tasks, delete tasks, manage members, manage sub-teams, manage settings, manage projects, view reports, full access, assign tasks, comment on tasks.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 14: PROFILE & SETTINGS ══════════
    heading('14. Profile & Settings'),
    ...s('profile_page', 560, 340),

    heading('14.1 Editing Your Profile', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click your avatar or the Profile icon at the bottom of the sidebar.'),
    numberedStep(2, 'Change your name in the "Full Name" field.'),
    numberedStep(3, 'Click "Save Changes".'),

    heading('14.2 Changing the Theme', HeadingLevel.HEADING_2),
    para('Choose between Light mode, Dark mode, or System (follows your device\u2019s setting).'),
    bullet('Light \u2014 White background, dark text.'),
    bullet('Dark \u2014 Dark background, light text (easier on the eyes at night).'),
    bullet('System \u2014 Automatically matches your computer\u2019s theme.'),
    para('You can also toggle the theme from the sun/moon icon in the header.'),

    heading('14.3 Notification Preferences', HeadingLevel.HEADING_2),
    para('Toggle which notifications you want to receive:'),
    bullet('Task assigned to me'),
    bullet('New comment on my tasks'),
    bullet('Status changed on my tasks'),
    para('You can also set Quiet Hours (e.g., 10pm to 8am) when no notifications will bother you.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 15: TRASH ══════════
    heading('15. Trash'),
    para('When you delete a task, it goes to Trash first. It\u2019s not gone forever yet.'),
    ...s('trash_page', 560, 340),

    heading('15.1 Recovering a Deleted Task', HeadingLevel.HEADING_2),
    numberedStep(1, 'Click "Trash" in the sidebar.'),
    numberedStep(2, 'Find the task you want to bring back.'),
    numberedStep(3, 'Click "Restore". The task goes back to its project, good as new.'),

    heading('15.2 Permanently Deleting a Task', HeadingLevel.HEADING_2),
    numberedStep(1, 'In the Trash page, click "Delete" next to the task.'),
    numberedStep(2, 'The task is gone forever. This cannot be undone!'),
    para('Automatic cleanup: Tasks that sit in Trash for more than 30 days are permanently deleted automatically.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ══════════ CHAPTER 16: TIPS & TRICKS ══════════
    heading('16. Tips & Tricks'),

    heading('16.1 Work Faster', HeadingLevel.HEADING_2),
    bullet('Use Ctrl+K to quickly search for any task instead of scrolling.'),
    bullet('Press N to create a new task without touching the mouse.'),
    bullet('Use number keys 1-4 to switch views instantly.'),
    bullet('Use bulk select (checkboxes) to update many tasks at once.'),

    heading('16.2 Stay Organized', HeadingLevel.HEADING_2),
    bullet('Set priorities on every task \u2014 it helps when you have lots of tasks.'),
    bullet('Use the Gantt view to spot scheduling conflicts and overlapping tasks.'),
    bullet('Add dependencies when one task must be done before another can start.'),
    bullet('Use sub-tasks to break big tasks into small, manageable steps.'),

    heading('16.3 Collaborate Better', HeadingLevel.HEADING_2),
    bullet('Use comments on tasks to keep discussions in context (not in chat).'),
    bullet('Set Primary vs Secondary assignees so everyone knows who\u2019s the lead.'),
    bullet('Check the Team Dashboard to see if anyone is overloaded.'),
    bullet('Use chat for quick questions that don\u2019t belong on a specific task.'),

    heading('16.4 Mobile Tips', HeadingLevel.HEADING_2),
    bullet('Use the bottom navigation bar for quick access to Tasks, Team, Search, Chat, and Alerts.'),
    bullet('The sidebar opens with the hamburger menu icon (top-left).'),
    bullet('All views work on mobile, but Board and Gantt scroll horizontally.'),

    divider(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: 'End of Manual', font: 'Calibri', size: 24, bold: true, color: '4F46E5' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Questions? Ask your team admin or check the keyboard shortcuts (press ?).', font: 'Calibri', size: 20, color: '6B7280' })] }),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, font: 'Calibri', color: '1F2937' }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Calibri', color: '374151' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          children: [new TextRun({ text: 'Team Task Manager \u2014 User Manual', font: 'Calibri', size: 16, color: '9CA3AF' })],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Page ', font: 'Calibri', size: 16, color: '9CA3AF' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '9CA3AF' })],
        })] }),
      },
      children,
    }],
  });

  const outPath = path.join(process.cwd(), 'Team-Task-Manager-User-Manual.docx');
  const buffer = Packer.toBuffer(doc).then((buf) => {
    fs.writeFileSync(outPath, buf);
    console.log(`Manual saved to: ${outPath}`);
    console.log(`File size: ${(buf.length / 1024).toFixed(0)} KB`);
  });
  return buffer;
}

// ─── Main ─────────────────────────────────────────────────────────────
(async () => {
  let shots = {};
  try {
    shots = await captureScreenshots();
  } catch (e) {
    console.warn('Screenshot capture failed, generating manual without images:', e.message);
  }
  await generateManual(shots);
})();
