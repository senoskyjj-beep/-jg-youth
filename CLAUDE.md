# CLAUDE.md — JG Youth Portal

> Place this file at the root of the `-jg-youth` repo. Claude Code reads it automatically
> at the start of every session. It contains NO secrets and NO member data on purpose —
> keep it that way.

---

## ⚠️ Read first — this is a LIVE app

This app is in active use by ~200 real youth-group members and several leaders in the
field. **Changes pushed to this repo go live immediately** via GitHub Pages. Do not push
untested changes. Default to: make the edit, parse-check it, show me the diff, and wait
for my go-ahead before committing/pushing. When in doubt, ask.

---

## What it is

The **Jeremiah Generation (JG) Youth Portal** — youth registration, QR check-in,
attendance, leader management and messaging for the Jeremiah Generation youth group at
Living Waters Fellowship (AFM Lephalale, Limpopo, South Africa). ~80–200 active members,
~200 registered. Used in the field on phones and tablets. A discipleship framework called
**L.E.A.D.** is built in. The owner (Joshua) is the sole admin and is **not** a developer.
Co-admins: Priscilla and Pastor Billy.

---

## Architecture (unusual — read carefully)

**Frontend**
- A **single React source file: `App.js`** (~4,000–4,200 lines), plus `index.html`,
  `styles.css`, `build.js`, and the generated `App.compiled.js`.
- **There IS now a lightweight build step (added 2026-06-19).** `App.js` is the editable
  source (JSX). `build.js` transpiles it to **`App.compiled.js`** (plain browser JS, classic
  React runtime). `index.html` loads `App.compiled.js` as a normal script — it pins React
  18.2.0 + ReactDOM and **no longer downloads Babel**. This was done because the old setup
  downloaded a ~3MB in-browser Babel on every open, which stalled on slow ADSL and showed
  a grey/blank screen. Now the app loads like a static page.
- **Workflow when changing the app:** edit `App.js` → run `node build.js` → commit BOTH
  `App.js` and `App.compiled.js`. The browser only ever runs `App.compiled.js`; editing
  `App.js` without rebuilding deploys nothing. `App.compiled.js` is AUTO-GENERATED — never
  hand-edit it.
- `build.js` needs `@babel/standalone`: run `npm install @babel/standalone` first (it is
  gitignored along with `node_modules`).
- Hosted on **GitHub Pages**: `senoskyjj-beep.github.io/-jg-youth/` (repo `-jg-youth`).
  Pushing to the repo's default branch deploys it. `index.html` uses `?v=` cache-busting
  query strings — **bump the version** (e.g. `20260619c` → `20260620a`) on any deploy that
  must reach all devices immediately, otherwise phones keep the cached old file.

**Backend (NOT in this repo)**
- **Google Apps Script** (`Code.gs`), deployed as a web app, currently **Version 16**.
  It is edited in the Apps Script editor, not here. If a local copy of `Code.gs` exists
  in this repo, treat it as reference only — editing it here does NOT deploy it.
- Writes to a **Google Sheet**: tabs `Members`, `CheckIns`, `Leaders`, `LeaderLog`,
  `Feedback`, `MessageLog`. Member photos in **Google Drive** ("JG Photos"), served as
  `lh3.googleusercontent.com` URLs.

**Secrets — never put these in code**
- `SYNC_TOKEN` and `ADMIN_PINS` live in **Apps Script → Project Settings → Script
  Properties**. Refer to them only as `<SYNC_TOKEN>` / `<ADMIN_PINS>`. Do not add real
  values to `App.js` or any file. Destructive ops (delete member, sync leaders) are gated
  behind server-side master-PIN verification + rate limiting.

---

## Hard rules

1. **One syntax error = blank screen with no visible error.** `App.js` must stay valid JSX.
   **Always run `node build.js` and commit the regenerated `App.compiled.js`** — if the
   build fails, do not deploy. The browser runs `App.compiled.js`, not `App.js`.
2. **Parse-check before every commit.** Verify `App.js` transpiles cleanly with
   `@babel/standalone` (the real transform), not just `@babel/parser` — `build.js` does this
   and will exit non-zero on failure. After building, sanity-check that `App.compiled.js`
   renders (a headless jsdom render is ideal). Do not skip this.
3. **Make surgical, exact-match edits.** Never rewrite the whole file. A full-file rewrite
   risks silently dropping working code.
4. **Commit + push via git** (this is the safe way to deploy the frontend — git does not
   truncate). Show me the diff before pushing. Wait for approval.
5. **`Code.gs` is deployed manually by the owner**: Apps Script → Deploy → Manage
   Deployments → Edit → New Version. The URL stays the same; the version must increment.
   If you change backend logic, tell the owner exactly what to redeploy.
6. The `SYNC_TOKEN` in the live `App.js` is authoritative over any older doc. It sits in
   the browser so it isn't truly secret — server-side PIN checks are the real protection.
7. Deleting a member can orphan one check-in row. Harmless — the app ignores check-ins
   with no matching member.

---

## Useful conventions

- Data coming back from Google Sheets is frequently the **wrong type** — a PIN or phone
  arrives as a **number** instead of a string, or a field is null/undefined. Coerce with
  `String(x)` and guard before `.slice` / `.map` / `.toLowerCase` etc.
- Deliver fixes bundled together, not as a stream of tiny changes.
- Keep instructions for the owner mobile-friendly: numbered, concise.

---

## Current state

Live, ~200 members. Recently completed: server-side security overhaul (PINs out of
`App.js`, secrets in Script Properties, destructive ops gated + rate-limited);
`postToGoogle` now reads the server reply (was false-success on every save);
`loadFromGoogle` no longer wipes the `events` array on refresh; admin PIN frozen at action
time (not read from live localStorage); dedup with over-merge guard + field-level merge;
Drive photo URL fix; photo-upload reliability; non-blocking registration; unsynced-items
banner; Leaders panel blank-screen fix (`nextPin` crashing on missing/numeric PINs);
member-picker autofill fix (compare IDs as strings); 10-min admin auto-logout;
auto-return home after check-in; birthday range ages 5–30.

## Known open problems

- **Cross-device check-in sync is fragile**: check-ins on one device don't reliably appear
  on others, and refreshing can drop the "Here Today" count to zero. Workaround: one
  device for all check-ins, no refresh.
- A member-count +1 during re-upload suggests a possible lingering duplicate.
- Full re-upload-and-dedupe workflow still needs running across all leader phones.
- **Current bug:** the screen sometimes goes blank right after admin login (see notes).

## On the horizon

Capacitor packaging for Android/iOS; POPIA compliance for minors (privacy policy +
parental consent); app-store content moderation/reporting; migrate photo storage off
browser localStorage; Apple nonprofit fee waiver; optional server sweep of orphaned
check-ins.
