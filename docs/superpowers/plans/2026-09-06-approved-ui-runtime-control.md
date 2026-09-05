# Approved UI + AI Runtime Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the approved UI/UX on production while keeping real data/business logic intact and make the AI runtime toggle operational.

**Architecture:** Preserve production `main` logic, transplant only the approved visual assets and UI transform, and replace direct anonymous calls to privileged AI RPCs with a custom-auth Edge Function bridge. Existing protected RPCs remain the source of truth.

**Tech Stack:** React 18, Vite 5, Supabase Postgres + Edge Functions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-06-approved-ui-runtime-control-design.md`

## Global Constraints
- Do not replace production data-loading logic with a parallel shell.
- Do not grant `anon`/`authenticated` direct EXECUTE on privileged AI-control RPCs.
- Preserve handoff protection and existing AI runtime semantics.
- Production build and lint must pass before merge.

---

### Task 1: Restore approved visual layer

**Files:**
- Modify: `reference-ui-transform.js`
- Modify: `src/main.jsx`
- Create: `src/ApprovedSectionChrome.jsx`
- Create/copy: approved CSS files from `backup-ui-2026-09-06`

**Interfaces:**
- Consumes: existing `App.jsx` component/function names.
- Produces: approved home/navigation/chrome/view markers and styling without changing API calls.

- [ ] Copy the approved transform/component/CSS assets from the preserved branch.
- [ ] Keep the production data-connected `App.jsx` logic untouched during this task.
- [ ] Run `npm run quality`; expect PASS.
- [ ] Commit the visual integration.

### Task 2: Add secured AI runtime control bridge

**Files:**
- Deploy: Supabase Edge Function `ai-runtime-control`
- Modify: `reference-ui-transform.js` to inject `aiRuntimeControl()` and reroute the three UI calls.

**Interfaces:**
- Consumes: `{ action, user_id, user_code, ...payload }`.
- Produces: JSON result from the existing protected AI runtime RPCs.

- [ ] Deploy an Edge Function with custom auth that validates active app user + admin/`ai_manage` permission.
- [ ] Ensure invalid credentials return 401/403.
- [ ] Ensure valid admin status action returns `scope`, `active_count`, and `eligible_count`.
- [ ] Inject frontend helper and replace `get_ai_runtime_status`, `set_ai_runtime`, and `set_ai_conversation_enabled` calls at build transform time.
- [ ] Run `npm run quality`; expect PASS.
- [ ] Commit the runtime-control fix.

### Task 3: Verify and publish

**Files:**
- No new functional files.

**Interfaces:**
- Consumes: completed branch.
- Produces: verified production `main` deployment.

- [ ] Verify protected RPCs still have no direct `anon`/`authenticated` EXECUTE.
- [ ] Verify Edge Function valid/invalid auth paths.
- [ ] Merge branch to `main` only after quality checks pass.
- [ ] Verify Vercel status is `success` for the resulting `main` commit.
- [ ] Verify production URL loads the approved UI and the AI runtime state is no longer stuck at `null`.
