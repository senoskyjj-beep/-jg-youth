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
- A **single React file: `App.js`** (~4,000–4,200 lines), plus `index.html` and
  `styles.css`. Three files only, at repo root.
- **Compiled in the browser by Babel at runtime. There is NO build step** — no webpack,
  no bundler, no `npm run build`. `index.html` loads `App.js` and Babel transpiles it on
  the fly.
- Hosted on **GitHub Pages**: `senoskyjj-beep.github.io/-jg-youth/` (repo `-jg-youth`).
  Pushing to the repo's default branch deploys it.

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

1. **No build step. Babel in-browser is unforgiving** — one syntax error or a duplicated
   block produces a **blank screen with no visible error.** `App.js` must stay valid JSX.
2. **Parse-check before every commit.** Never commit/push an `App.js` that doesn't parse
   as JSX. Install whatever you need to verify it; do not skip this.
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
