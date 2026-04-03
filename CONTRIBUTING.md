# Contributing to Task Manager

Hey! Here's how to set up the project and contribute code.

---

## Step 1: Accept the GitHub Invite

- Check your email or go to https://github.com/Arko-01/task-manager
- You should see an invite banner — click **Accept**

---

## Step 2: Clone the Project

Open your terminal and run:

```bash
git clone https://github.com/Arko-01/task-manager.git
cd task-manager
npm install
```

---

## Step 3: Set Up Supabase (Your Own Free Backend)

1. Go to https://supabase.com and create a free account
2. Click **New Project** — name it anything (e.g. "task-manager-dev")
3. Pick a database password and save it somewhere
4. Wait for the project to finish setting up (~1 min)
5. Go to **Project Settings → API** and copy:
   - Project URL
   - anon public key

6. In the project folder, create a file called `.env`:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

7. Go to **SQL Editor** in Supabase Dashboard and run each migration file **in order**. The files are in `supabase/migrations/`:
   - `001_*.sql`
   - `002_*.sql`
   - `003_*.sql`
   - `004_*.sql`
   - `005_*.sql`
   - `006_*.sql`
   - _(Skip 007 — it needs a paid feature)_

   Open each file, copy the SQL, paste it in the SQL Editor, and click **Run**.

---

## Step 4: Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser. Create an account through the sign-up page.

---

## Step 5: Before Making Any Changes

Always create a new branch first. **Never work directly on main.**

```bash
git checkout main
git pull origin main
git checkout -b feature/what-you-are-building
```

Name your branch based on what you're doing:
- `feature/dark-mode-fix`
- `fix/login-bug`
- `chore/cleanup-imports`

---

## Step 6: Save Your Work

After making changes:

```bash
git add .
git commit -m "short description of what you changed"
git push -u origin feature/what-you-are-building
```

---

## Step 7: Open a Pull Request

1. Go to https://github.com/Arko-01/task-manager
2. You'll see a yellow banner saying your branch was recently pushed
3. Click **"Compare & pull request"**
4. Write a short title and description of what you changed
5. Click **"Create pull request"**

I'll review it and merge it if everything looks good. You **cannot** merge it yourself — that's by design.

---

## If You're Using Claude Code

Claude can help you write code, but follow these rules:
- Always make sure you're on a feature branch, not main
- Ask Claude to read `CONTRIBUTING.md` and `CLAUDE.md` at the start of each session for project context
- Don't let Claude modify files in `supabase/migrations/` without checking with me first
- Don't commit `.env` — it's already in `.gitignore`

---

## Quick Reference

| What | Command |
|---|---|
| Start dev server | `npm run dev` |
| Create a branch | `git checkout -b feature/name` |
| Check your branch | `git branch` |
| Save & push changes | `git add .` → `git commit -m "msg"` → `git push` |
| Switch back to main | `git checkout main && git pull` |
