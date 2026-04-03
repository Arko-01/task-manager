/**
 * Capture comprehensive screenshots of every feature/view/modal in the Task Manager app.
 * Uses Playwright to automate a real browser session.
 * Run: node capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'https://task-manager-eight-vert-91.vercel.app';
const EMAIL = 'uat.tester@test.com';
const PASS = 'UatTest123!';
const DIR = path.join(process.cwd(), 'tech-ref-screenshots');

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const shots = {};
let shotCount = 0;

async function snap(page, name, opts = {}) {
  const { waitMs = 1500, fullPage = false } = opts;
  await page.waitForTimeout(waitMs);
  const p = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage });
  shots[name] = p;
  shotCount++;
  console.log(`  [${shotCount}] ${name}`);
}

async function setReactInput(page, selector, value) {
  const el = await page.$(selector);
  if (!el) return;
  await el.focus();
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel);
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { sel: selector, val: value });
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // ═══════════════════════════════════════════════════════
  // SECTION A: LOGIN & SIGNUP (unauthenticated)
  // ═══════════════════════════════════════════════════════
  console.log('\n=== Section A: Login & Signup ===');
  const ctxAnon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageAnon = await ctxAnon.newPage();

  // 1. Login page - empty
  await pageAnon.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await snap(pageAnon, '01_login_empty', { waitMs: 2000 });

  // 2. Login page - validation errors (submit empty form)
  const submitBtn = pageAnon.locator('button[type="submit"]').first();
  if (await submitBtn.count()) await submitBtn.click();
  await snap(pageAnon, '02_login_validation_errors', { waitMs: 1000 });

  // 3. Login page - invalid credentials
  await setReactInput(pageAnon, 'input[type="email"]', 'wrong@test.com');
  await setReactInput(pageAnon, 'input[type="password"]', 'WrongPass123');
  if (await submitBtn.count()) await submitBtn.click();
  await snap(pageAnon, '03_login_invalid_credentials', { waitMs: 3000 });

  // 4. Signup form
  const switchLink = pageAnon.locator('text=Sign up').first();
  if (await switchLink.count()) await switchLink.click();
  await snap(pageAnon, '04_signup_form', { waitMs: 1000 });

  // 5. Signup form - validation errors
  const signupSubmit = pageAnon.locator('button[type="submit"]').first();
  if (await signupSubmit.count()) await signupSubmit.click();
  await snap(pageAnon, '05_signup_validation_errors', { waitMs: 1000 });

  await ctxAnon.close();

  // ═══════════════════════════════════════════════════════
  // SECTION B: MAIN APP (authenticated as Admin)
  // ═══════════════════════════════════════════════════════
  console.log('\n=== Section B: Main App (Admin) ===');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const url = page.url();
  if (url.includes('login') || await page.locator('input[type="email"]').count() > 0) {
    await setReactInput(page, 'input[type="email"]', EMAIL);
    await setReactInput(page, 'input[type="password"]', PASS);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
  }

  // 6. Dashboard - List View (default landing)
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await snap(page, '06_dashboard_list_view', { waitMs: 3000 });

  // 7. Dashboard - Board/Kanban View
  const boardBtn = page.locator('button:has-text("Board")').first();
  if (await boardBtn.count()) { await boardBtn.click(); await snap(page, '07_dashboard_board_view', { waitMs: 2000 }); }

  // 8. Dashboard - Calendar View
  const calBtn = page.locator('button:has-text("Calendar")').first();
  if (await calBtn.count()) { await calBtn.click(); await snap(page, '08_dashboard_calendar_view', { waitMs: 2000 }); }

  // 9. Dashboard - Gantt View
  const ganttBtn = page.locator('button:has-text("Gantt")').first();
  if (await ganttBtn.count()) { await ganttBtn.click(); await snap(page, '09_dashboard_gantt_view', { waitMs: 2000 }); }

  // Switch back to list view
  const listBtn = page.locator('button:has-text("List")').first();
  if (await listBtn.count()) await listBtn.click();
  await page.waitForTimeout(1500);

  // 10. Sidebar - full navigation
  await snap(page, '10_sidebar_navigation', { waitMs: 500 });

  // 11. Task Detail - click on a task row
  const taskRow = page.locator('[class*="cursor-pointer"]').first();
  if (await taskRow.count()) { await taskRow.click(); await snap(page, '11_task_detail_panel', { waitMs: 2000 }); }

  // 12. Task Detail - scroll down to see comments, deps, assignees
  await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]') || document.querySelector('[class*="slide"]');
    if (panel) panel.scrollTop = panel.scrollHeight;
  });
  await snap(page, '12_task_detail_bottom', { waitMs: 1000 });

  // Scroll back up
  await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]') || document.querySelector('[class*="slide"]');
    if (panel) panel.scrollTop = 0;
  });

  // 13. Assignee Selector - try to find and click the plus/add assignee
  const addAssigneeBtn = page.locator('button:has-text("Add")').first();
  // Try alternative: plus button near assignees
  const plusBtns = page.locator('[aria-label*="ssign"], [aria-label*="add"]');
  if (await plusBtns.count()) {
    await plusBtns.first().click();
    await snap(page, '13_assignee_selector', { waitMs: 1000 });
    await page.keyboard.press('Escape');
  }

  // Close task detail
  const closeBtn = page.locator('button[aria-label*="lose"], button[title="Close"]').first();
  if (await closeBtn.count()) await closeBtn.click();
  await page.waitForTimeout(500);

  // 14. Quick Add Task input
  const quickAdd = page.locator('input[aria-label*="new task"], input[placeholder*="Add"]').first();
  if (await quickAdd.count()) {
    await quickAdd.click();
    await snap(page, '14_quick_add_task', { waitMs: 500 });
  }

  // 15. Task Filters - open filter dropdowns
  await snap(page, '15_task_filters_bar', { waitMs: 500 });

  // 16. Bulk Actions - select some tasks
  const checkboxes = page.locator('input[type="checkbox"]');
  const checkCount = await checkboxes.count();
  if (checkCount >= 3) {
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();
    await snap(page, '16_bulk_actions_toolbar', { waitMs: 1000 });
    // Uncheck
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();
  }

  // 17. Project Page - click on a project in sidebar
  const projectLink = page.locator('nav a[href*="project"], a[href*="project"]').first();
  if (await projectLink.count()) {
    await projectLink.click();
    await snap(page, '17_project_page_list', { waitMs: 3000 });
  } else {
    // Try clicking a project name in sidebar
    const projText = page.locator('text=General').first();
    if (await projText.count()) {
      await projText.click();
      await snap(page, '17_project_page_list', { waitMs: 3000 });
    }
  }

  // 18. Project page - Board view
  const projBoard = page.locator('button:has-text("Board")').first();
  if (await projBoard.count()) { await projBoard.click(); await snap(page, '18_project_board_view', { waitMs: 2000 }); }

  // 19. Project page - Calendar view
  const projCal = page.locator('button:has-text("Calendar")').first();
  if (await projCal.count()) { await projCal.click(); await snap(page, '19_project_calendar_view', { waitMs: 2000 }); }

  // 20. Project page - Gantt view
  const projGantt = page.locator('button:has-text("Gantt")').first();
  if (await projGantt.count()) { await projGantt.click(); await snap(page, '20_project_gantt_view', { waitMs: 2000 }); }

  // 21. Team Dashboard
  const teamLink = page.locator('text=Team Dashboard').first();
  if (await teamLink.count()) { await teamLink.click(); await snap(page, '21_team_dashboard', { waitMs: 3000 }); }

  // 22. Chat Panel - open
  const chatToggle = page.locator('button[title*="chat"], button[aria-label*="chat"]').first();
  if (await chatToggle.count()) {
    await chatToggle.click();
    await snap(page, '22_chat_panel', { waitMs: 2000 });
  } else {
    // Try finding chat button by SVG or text
    const chatBtns = page.locator('button').filter({ hasText: /chat/i });
    if (await chatBtns.count()) {
      await chatBtns.first().click();
      await snap(page, '22_chat_panel', { waitMs: 2000 });
    }
  }

  // 23. Chat - select a conversation if one exists
  const convItem = page.locator('[class*="cursor-pointer"]').filter({ hasText: /alice|bob|carol|team/i }).first();
  if (await convItem.count()) {
    await convItem.click();
    await snap(page, '23_chat_conversation', { waitMs: 2000 });
  }

  // Close chat panel
  await page.evaluate(() => {
    const chatPanel = document.querySelector('[class*="fixed"][class*="right-0"][class*="z-20"]');
    if (chatPanel) chatPanel.remove();
  });
  await page.waitForTimeout(500);

  // 24. Notifications dropdown
  try {
    const notifBtn = page.locator('button[aria-label="Notifications"]').first();
    if (await notifBtn.count()) {
      await notifBtn.click({ timeout: 5000 });
      await snap(page, '24_notifications_dropdown', { waitMs: 1500 });
      await page.keyboard.press('Escape');
    }
  } catch (e) { console.log('  [skip] notifications dropdown'); }

  // 25. Command Palette (Ctrl+K)
  try {
    await page.keyboard.press('Control+k');
    await snap(page, '25_command_palette', { waitMs: 1500 });
    await page.keyboard.press('Escape');
  } catch (e) { console.log('  [skip] command palette'); }

  // 26. Keyboard Shortcuts Help (?)
  try {
    await page.keyboard.press('?');
    await page.waitForTimeout(500);
    const shortcutModal = page.locator('text=Keyboard Shortcuts').first();
    if (await shortcutModal.isVisible().catch(() => false)) {
      await snap(page, '26_keyboard_shortcuts', { waitMs: 1000 });
      await page.keyboard.press('Escape');
    }
  } catch (e) { console.log('  [skip] keyboard shortcuts'); }

  // 27. Admin Panel - Members
  try {
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 60000 });
    await snap(page, '27_admin_members', { waitMs: 3000 });
  } catch (e) { console.log('  [skip] admin members'); }

  // 28. Admin Panel - expand a member's permissions
  try {
    const permToggle = page.locator('button:has-text("Permissions"), button:has-text("permissions")').first();
    if (await permToggle.count()) {
      await permToggle.click();
      await snap(page, '28_admin_permissions_expanded', { waitMs: 1000 });
    }
  } catch (e) { console.log('  [skip] admin permissions'); }

  // 29. Admin Panel - Sub-Teams tab
  try {
    const subTeamsTab = page.locator('button:has-text("Sub-Teams"), button:has-text("Sub-teams")').first();
    if (await subTeamsTab.count()) {
      await subTeamsTab.click();
      await snap(page, '29_admin_subteams', { waitMs: 1500 });
    }
  } catch (e) { console.log('  [skip] admin subteams'); }

  // 30. Admin Panel - Settings tab
  try {
    const settingsTab = page.locator('button:has-text("Settings")').first();
    if (await settingsTab.count()) {
      await settingsTab.click();
      await snap(page, '30_admin_settings', { waitMs: 1500 });
    }
  } catch (e) { console.log('  [skip] admin settings'); }

  // 31. Profile page
  try {
    await page.goto(BASE + '/profile', { waitUntil: 'networkidle', timeout: 60000 });
    await snap(page, '31_profile_page', { waitMs: 2000 });
  } catch (e) { console.log('  [skip] profile page'); }

  // 32. Profile - notification preferences (scroll down)
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await snap(page, '32_profile_notifications', { waitMs: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
  } catch (e) { console.log('  [skip] profile notifications'); }

  // 33. Trash page
  try {
    await page.goto(BASE + '/trash', { waitUntil: 'networkidle', timeout: 60000 });
    await snap(page, '33_trash_page', { waitMs: 2000 });
  } catch (e) { console.log('  [skip] trash page'); }

  // 34. Team Switcher - click in sidebar
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const teamSwitcher = page.locator('[class*="team-switch"], button:has-text("Switch")').first();
    if (await teamSwitcher.count()) {
      await teamSwitcher.click();
      await snap(page, '34_team_switcher', { waitMs: 1000 });
      await page.keyboard.press('Escape');
    }
  } catch (e) { console.log('  [skip] team switcher'); }

  // ═══════════════════════════════════════════════════════
  // SECTION C: DARK MODE
  // ═══════════════════════════════════════════════════════
  console.log('\n=== Section C: Dark Mode ===');
  try {
    await page.evaluate(() => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); });
    await page.waitForTimeout(500);

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await snap(page, '35_dark_dashboard_list', { waitMs: 2000 });

    const darkBoard = page.locator('button:has-text("Board")').first();
    if (await darkBoard.count()) { await darkBoard.click(); await snap(page, '36_dark_board_view', { waitMs: 2000 }); }

    const darkListBtn = page.locator('button:has-text("List")').first();
    if (await darkListBtn.count()) await darkListBtn.click();
    await page.waitForTimeout(1000);
    const darkTask = page.locator('[class*="cursor-pointer"]').first();
    if (await darkTask.count()) {
      await darkTask.click();
      await snap(page, '37_dark_task_detail', { waitMs: 2000 });
      const darkClose = page.locator('button[aria-label*="lose"], button[title="Close"]').first();
      if (await darkClose.count()) await darkClose.click({ timeout: 3000 }).catch(() => {});
    }

    // Dark chat
    try {
      const darkChat = page.locator('button[title*="chat"], button[aria-label*="chat"]').first();
      if (await darkChat.count()) {
        await darkChat.click({ timeout: 5000 });
        await snap(page, '38_dark_chat_panel', { waitMs: 2000 });
        await page.evaluate(() => {
          const chatPanel = document.querySelector('[class*="fixed"][class*="right-0"][class*="z-20"]');
          if (chatPanel) chatPanel.remove();
        });
      }
    } catch (e) { console.log('  [skip] dark chat'); }

    await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await snap(page, '39_dark_admin_panel', { waitMs: 2000 });

    await page.goto(BASE + '/profile', { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await snap(page, '40_dark_profile', { waitMs: 2000 });

    await page.evaluate(() => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); });
  } catch (e) { console.log('  [error] dark mode section:', e.message); }

  await ctx.close();

  // ═══════════════════════════════════════════════════════
  // SECTION D: MOBILE VIEW
  // ═══════════════════════════════════════════════════════
  console.log('\n=== Section D: Mobile View ===');
  try {
    const ctxMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      isMobile: true, hasTouch: true,
    });
    const pageMobile = await ctxMobile.newPage();

    await pageMobile.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
    await pageMobile.waitForTimeout(2000);
    if (pageMobile.url().includes('login')) {
      await setReactInput(pageMobile, 'input[type="email"]', EMAIL);
      await setReactInput(pageMobile, 'input[type="password"]', PASS);
      await pageMobile.locator('button[type="submit"]').first().click();
      await pageMobile.waitForTimeout(4000);
    }

    // 41. Mobile login (separate context)
    try {
      const ctxML = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
      const pageML = await ctxML.newPage();
      await pageML.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
      await snap(pageML, '41_mobile_login', { waitMs: 2000 });
      await ctxML.close();
    } catch (e) { console.log('  [skip] mobile login'); }

    // 42. Mobile dashboard
    await pageMobile.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await snap(pageMobile, '42_mobile_dashboard', { waitMs: 3000 });

    // 43. Mobile sidebar
    try {
      const hamburger = pageMobile.locator('button').first();
      await hamburger.click({ timeout: 5000 });
      await snap(pageMobile, '43_mobile_sidebar_open', { waitMs: 1500 });
      await pageMobile.keyboard.press('Escape');
    } catch (e) { console.log('  [skip] mobile sidebar'); }

    // 44. Mobile task detail
    try {
      await pageMobile.waitForTimeout(1000);
      const mobileTask = pageMobile.locator('[class*="cursor-pointer"]').first();
      if (await mobileTask.count()) {
        await mobileTask.click({ timeout: 5000 });
        await snap(pageMobile, '44_mobile_task_detail', { waitMs: 2000 });
        await pageMobile.keyboard.press('Escape');
      }
    } catch (e) { console.log('  [skip] mobile task detail'); }

    // 45. Mobile bottom nav
    await pageMobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await snap(pageMobile, '45_mobile_bottom_nav', { waitMs: 1000 });

    await ctxMobile.close();
  } catch (e) { console.log('  [error] mobile section:', e.message); }

  // ═══════════════════════════════════════════════════════
  // SECTION E: MEMBER ROLE (RBAC)
  // ═══════════════════════════════════════════════════════
  console.log('\n=== Section E: Member Role (RBAC) ===');
  try {
    const ctxAlice = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageAlice = await ctxAlice.newPage();
    await pageAlice.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
    await pageAlice.waitForTimeout(2000);
    if (pageAlice.url().includes('login') || await pageAlice.locator('input[type="email"]').count() > 0) {
      await setReactInput(pageAlice, 'input[type="email"]', 'alice.chat@test.com');
      await setReactInput(pageAlice, 'input[type="password"]', 'ChatTest123!');
      await pageAlice.locator('button[type="submit"]').first().click();
      await pageAlice.waitForTimeout(4000);
    }

    await pageAlice.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await snap(pageAlice, '46_member_dashboard', { waitMs: 3000 });

    const aliceTask = pageAlice.locator('[class*="cursor-pointer"]').first();
    if (await aliceTask.count()) {
      await aliceTask.click();
      await snap(pageAlice, '47_member_task_detail', { waitMs: 2000 });
      await pageAlice.keyboard.press('Escape');
    }

    await ctxAlice.close();
  } catch (e) { console.log('  [error] RBAC section:', e.message); }

  await browser.close();

  // Write shot manifest
  const manifest = JSON.stringify(shots, null, 2);
  fs.writeFileSync(path.join(DIR, 'manifest.json'), manifest);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${shotCount} screenshots captured.`);
  console.log(`Directory: ${DIR}`);
  console.log(`${'='.repeat(50)}`);
})();
