# PROJECT_MEMORY.md — JG Youth Portal (recovery notes, 2026-07-03)

> Written after Joshua accidentally deleted his Claude chat threads on his PC.
> **No code was lost** — everything lives safely in this GitHub repo.
> This file is the "memory" of the project: what it is, what's been done, what's
> still broken, and how to continue working on it from any computer.
>
> Claude Code automatically reads `CLAUDE.md` at the start of every session —
> that file has the working rules. This file adds the full history and the
> "how to pick up where we left off" steps. Keep both files up to date.
> Like `CLAUDE.md`, this file must contain **no secrets and no member data**.

---

## 1. How to continue on your PC (do this first)

1. Open Claude Code on your PC, in the folder where the project lives.
2. If the folder is gone or you're not sure it's current, tell Claude:
   *"Clone `senoskyjj-beep/-jg-youth` from GitHub and read `CLAUDE.md` and
   `PROJECT_MEMORY.md`."*
3. If the folder is still there, tell Claude:
   *"Run `git pull origin main`, then read `CLAUDE.md` and `PROJECT_MEMORY.md`."*
4. That's it. Claude will have all the context in these two files. Deleted chat
   threads cannot be restored, but they aren't needed — the important knowledge
   is written down here.

---

## 2. What this app is

- **Jeremiah Generation (JG) Youth Portal** — Living Waters Fellowship
  (AFM Lephalale, Limpopo, South Africa).
- Youth registration, QR check-in, attendance, leader management, messaging,
  and the **L.E.A.D.** discipleship framework.
- ~200 registered members, ~80–200 active. Used live, in the field, on phones
  and tablets. **Pushing to `main` deploys immediately** via GitHub Pages:
  `https://senoskyjj-beep.github.io/-jg-youth/`
- Owner/admin: **Joshua** (not a developer). Co-admins: Priscilla, Pastor Billy.

## 3. Architecture in one minute

- **Frontend (this repo):** one big React source file `App.js` (~4,000 lines).
  `node build.js` transpiles it to `App.compiled.js`, which is what the browser
  actually runs (loaded by `index.html`). React 18.2.0 pinned via unpkg.
  No in-browser Babel any more (removed 2026-06-19 — it was 3MB per load and
  caused blank screens on slow ADSL).
- **Workflow for every frontend change:**
  edit `App.js` → `node build.js` → commit **both** `App.js` and
  `App.compiled.js` → push to `main` → bump the `?v=` version in `index.html`
  (currently `20260627g`) if the change must reach all phones immediately.
- **Backend (NOT in this repo):** Google Apps Script `Code.gs`, deployed as a
  web app, **Version 16**. Edited/deployed only in the Apps Script editor
  (Deploy → Manage Deployments → Edit → New Version — URL stays the same).
- **Data:** Google Sheet with tabs `Members`, `CheckIns`, `Leaders`,
  `LeaderLog`, `Feedback`, `MessageLog`. Photos in Google Drive ("JG Photos").
- **Secrets:** `SYNC_TOKEN` and `ADMIN_PINS` live in Apps Script → Project
  Settings → Script Properties. Never write real values into any repo file.

## 4. Full history of work done (from git, oldest → newest)

**June 1–5, 2026 — early days.** App built and uploaded file-by-file through
the GitHub web UI ("Add files via upload" commits). No build step, no git
workflow yet.

**June 18 — data-loss fixes.** Fixed events being wiped on sync
(`loadFromGoogle` no longer clears the `events` array) and timezone bugs in
date comparisons.

**June 19 — the big stability day.**
- Added `CLAUDE.md` (persistent session context).
- Fixed a wave of blank-screen crashes: unguarded `JSON.parse` calls in the
  admin render path and elsewhere, null entries in localStorage corrupting the
  initial `useState`, null-element accesses in `events`/`computeStatus`/
  `sortAlpha`. Added a React error boundary.
- Fixed a Babel Standalone parse failure (nested IIFE inside JSX).
- **Added the build step:** `build.js` pre-compiles `App.js` →
  `App.compiled.js`; `index.html` no longer downloads Babel. Fixed the
  slow/blank load on ADSL.
- Added `?v=` cache-busting to `App.js`/`styles.css` loads; added `.gitignore`.
- Fixed `postToGoogle` reporting success even when the save failed, and a bug
  where a new member's photo was dropped.

**June 27 — usability round.**
- Photo-pending notice; message screen reworked into a 4-button grid;
  dead-code removal.
- Faster, clearer admin login; de-jumbled the Visitors & Reports tabs.
- Photos now move off the phone (out of localStorage) once safely on Drive.

**June 30 — latest work (current state of `main`).**
- Shorter admin session, backend keep-warm ping, stuck-photo warning.
- Extracted the hardcoded banner image out of the JS source into `banner.jpg`.

Earlier server-side work (in `Code.gs`, not visible in this repo's history):
security overhaul — PINs moved out of `App.js` into Script Properties,
destructive ops (delete member, sync leaders) gated behind server-side
master-PIN checks + rate limiting; dedup with over-merge guard and
field-level merge; Drive photo URL fix; 10-minute admin auto-logout;
member-picker ID-as-string fix; birthday age range 5–30; auto-return home
after check-in.

## 5. Known open problems (as of 2026-07-03)

1. **Cross-device check-in sync is fragile** — check-ins on one device don't
   reliably show on others; refreshing can drop "Here Today" to zero.
   Field workaround: use one device for all check-ins, don't refresh.
2. **Blank screen sometimes right after admin login** — current bug, not yet
   diagnosed.
3. Member count went +1 during a re-upload → possible lingering duplicate.
4. The full re-upload-and-dedupe workflow still needs running across all
   leader phones.

## 6. On the horizon (not started)

Capacitor packaging for Android/iOS; POPIA compliance for minors (privacy
policy + parental consent); app-store content moderation/reporting; moving
photo storage fully off browser localStorage; Apple nonprofit fee waiver;
optional server sweep of orphaned check-ins.

## 7. Golden rules (short version — full version in CLAUDE.md)

1. This is a **live app** — never push untested changes to `main`.
2. Always `node build.js` after editing `App.js`; commit both files; a build
   failure means **do not deploy**.
3. Surgical edits only — never rewrite the whole file.
4. Show Joshua the diff and wait for his go-ahead before pushing.
5. `Code.gs` changes are deployed manually by Joshua in Apps Script.
6. Data from Google Sheets often has wrong types (numbers instead of strings,
   nulls) — always coerce and guard.
