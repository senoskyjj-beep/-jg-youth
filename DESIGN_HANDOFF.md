# Youth Portal — Design Handoff

A church youth-group management app (registration, check-in, and leadership admin) for **Living Waters Fellowship / Jeremiah Generation**. Built as an interactive HTML prototype. This document captures the design decisions made in conversation and the full prototype source, so it can be handed to Claude Code (or any developer) to implement in a real codebase.

## About this file
The HTML referenced/embedded below is a **design reference prototype**, not production code to copy verbatim — it uses a proprietary templating runtime (`{{ }}` bindings, `<sc-if>`/`<sc-for>` tags, a `support.js` runtime) that only exists in the design tool it was built in. The task for engineering is to **recreate this design and behavior in the target codebase's actual stack** (React Native, Flutter, native iOS/Android, or plain React/Vue for a web app) using that stack's normal patterns — not to try to run this file as-is.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and interaction behavior below are final/intended — implement pixel-close to what's described, adapting only to the target platform's native components.

## Platform priority
Primary: **phone** (Android + iOS), ~95% of real-world usage. Secondary: tablet. Minimum-support: laptop/web. Design accordingly — this is a mobile-first, one-handed app used in a church hall.

---

## Product overview

Four main audiences/flows from one home screen:
1. **Registration** — a young person registers themselves (member or first-time visitor).
2. **Member Check-In** — returning members find their name and check in for the day, logging a mood.
3. **Leader Check-In** — same flow, for leaders (currently reuses the member check-in screen).
4. **Leadership Admin** — leaders/pastors manage attendance, communication, and events. (PIN gate is currently disabled during design review — reinstate before shipping.)

### Tone & visual direction
- Lively, "social app" energy aimed at teens/young adults — not a stiff church-admin tool.
- Dark mode is the default; a light/dark toggle (🌙/☀️) sits top-right on every screen.
- Emojis are the intentional icon system throughout (✝️, 📝, ✅, ⭐, 🎉, etc.) — not a placeholder to be replaced with an icon font.
- Brand: purple/blue/indigo gradient hero (`#6c63ff → #3b82f6 → #a855f7`), "Jeremiah Generation" wordmark with a 3D drop-shadow text effect, cross emoji as the logo mark (a real logo file was requested from the user but never supplied — placeholder emoji stands in for it).
- Micro-interactions matter: buttons get a pressed/tilt effect (`perspective + rotateX + scale` on `:active`), cards flip in 3D (`transform-style: preserve-3d`, `backface-visibility: hidden`) rather than sliding/fading.

### Reward system
On completing registration, the user lands on a celebratory screen: confetti animation, a green checkmark pop-in, and a unique reward code (`JG-####`) they show to a leader for a small gift. This was an explicit ask — positive reinforcement for finishing registration.

---

## Screens

### 1. Home
- Hero banner (230px tall): gradient background, floating cross emoji (subtle up/down float loop), "Jeremiah Generation" title with layered text-shadow for a 3D pop effect, "LIVING WATERS FELLOWSHIP" eyebrow label above it.
- Three stat pills below the hero: Registered / Here Today / Visitors — each a card with a colored top border (indigo/green/purple) and a big number.
- Four stacked action buttons: Registration (indigo gradient), Member Check-In (green gradient), Leader Check-In (amber gradient), Leadership Admin (outlined, quiet — de-emphasized on purpose per the client: "check-in and registration must stand out, admin can be small").
- Footer credit line: leader names + org name.

### 2. PIN (admin gate)
- Cross emoji, "Admin Access" title, 5-dot PIN indicator, numeric keypad (0–9 + delete).
- Shake animation + red error text on wrong PIN.
- **Currently bypassed** — Admin button on Home goes straight to the Admin screen while the client reviews the admin design. Numeric PIN flow markup/logic still exists and should be reconnected before launch (see "Leaders" admin tab for the PIN values leaders would use).

### 3. Check-In (members & leaders)
- Search-by-name input.
- List of people as flip cards: front shows avatar-initials, name, checked-in status, chevron. Tapping flips the card (3D rotateY) to reveal a "How do you feel today?" mood-emoji picker (6 emojis: 😄😊😐😔😢🤩) and a Confirm Check-In button.
- Tapping a mood emoji highlights it (scaled-up background tint + border) so the selection is visibly confirmed — this was a fix for a bug where taps registered but gave no visual feedback ("emoji not working").

### 4. Registration
- First asks: "Which one are you?" → Visitor or Member (two big gradient buttons).
- Then offers **two interchangeable UX variants** via a segmented toggle (client asked for both, to compare):
  - **Step-by-step**: one field per screen, big centered input, progress dots, Back/Next buttons. Steps: name → surname → phone → birthday → address → school → guardian name → guardian relation → guardian phone → mood. On the last step, picking a mood auto-advances straight to the reward screen (no explicit submit).
  - **One page**: every field stacked in a single scrolling form, ending in one "Complete Registration" button.
- Special field treatments (both variants):
  - **Birthday**: three native `<select>` dropdowns — day (1–31), month (Jan–Dec), year (last 26 years, i.e. current year back 25) — chosen specifically so it's a simple scroll-wheel-style picker rather than a custom calendar.
  - **Address**: free-text input with a simulated autocomplete dropdown (mock list of SA addresses filtered as you type). **Real implementation should wire this to the Google Places/Maps Autocomplete API** — the prototype fakes it with a static list since no API key is available in the design tool.
  - **Guardian relationship**: quick-pick chips (Mom / Dad / Aunt / Uncle / Guardian) instead of free text.
  - Every registration collects full parent/guardian contact details (name, relationship, phone) — added specifically so admin can reach a parent, not just the child.

### 5. Reward (post-registration celebration)
- Full-screen confetti (emoji particles falling + rotating on a loop).
- Green pop-in checkmark, "Registered!" headline.
- Dashed-border card with a 🎁 icon and a big reward code (`JG-####`) to show a leader for a small gift — the incentive mechanic the client asked for.
- "Back to Home" button.

### 6. Leadership Admin
Full redesign from an earlier dense 17-tile grid. Current structure is **overlay-driven navigation**: the admin home shows a short list of big tappable cards; tapping one takes over the *entire* screen (nothing else from the admin home is visible/interactive behind it) until the user explicitly closes it (✕ button, top-right of the overlay). This was an explicit fix — the previous 3D-flip-tile approach left users unsure how to "go back."

Admin home contains, top to bottom:
- **Absent Today** hero card (red/amber gradient, full-width): big centered number of absentees out of total, tap to open.
- **People** — members + visitors, each searchable, tap a person to open Member Detail.
- **Leaders** — leader roster (name, PIN, attendance %), plus Events/QR Code/Reset as simple info rows.
- **Special Events** (new tab, this session) — create an event (name + date), attach a poster image, live text preview of the outbound message, and three explicit send actions: WhatsApp to the Youth group, WhatsApp to the Parents group (both include the poster), and SMS to parents (**text only — the SMS channel deliberately strips the image**, per client instruction that SMS can't carry media). Each channel shows "Sent ✓" once tapped.
- **Communication** — WhatsApp group pending requests, suggestions inbox, sent-today count. Split out from Data as its own tab per client request (previously combined).
- **Data** — reports (attendance %), export/import, pending sync queue. Kept separate from Communication.

Tapping **Absent Today** opens a dedicated messaging sub-flow (all still within the one full-screen overlay, no other admin content visible):
1. Searchable list of absent people, each with a WhatsApp and an SMS button.
2. Tapping either asks *who* to message: WhatsApp → Parent or Member; SMS → Parent or Child.
3. Then a list of pre-written message templates to pick from. **A template that has already been used for that person+channel shows struck-through and greyed out** (so a leader can see at a glance what's already been sent), but templates are never permanently removed — the same set is available every week since a different person may be absent next time.
4. "Send message" button confirms and returns to the absent list.

### 7. Member Detail
Reached from any person row in People or Absent lists. Shows:
- Avatar-initials, full name, "In Youth since {date}".
- **Parent/Guardian card**: name, relation, phone, with WhatsApp/SMS quick-action buttons.
- **Attendance card**: last-8-Sundays bar chart (green = attended, red = missed) plus attended/missed counts — this is the "history of attendance" the client asked to see per person.
- **Communication history card**: chronological log of past outreach to this person/family (e.g. "Missed 2 weeks — sent WhatsApp check-in, 3 weeks ago") — the "history of communication" the client asked for, so leaders can see whether/how often a person has been followed up with.

---

## Known gaps / follow-ups (things flagged during the conversation but not yet built)
- **Real logo**: client wants their own logo graphic (not the ✝️ emoji placeholder) with a 3D pop treatment — never supplied a file, needs to be provided and swapped in.
- **PIN gate**: currently bypassed for admin (client asked to see the admin screen without re-entering a PIN during review). Reconnect the existing PIN/numpad flow before shipping — logic for it is still in the code, just not wired into the nav.
- **Address autocomplete**: simulated with a static list; needs real Google Places/Maps integration.
- **Leader Check-In**: currently identical to Member Check-in (reuses the same screen/data) — client may want it distinct (e.g. different mood set, or skip the mood step) — not explicitly specified.
- Messaging "send" actions (WhatsApp/SMS/event blasts) are prototype-only — no real messaging API is wired up; button state just flips to "Sent ✓" locally.

---

## Design tokens

### Dark theme (default)
```
page/app background : #0f172a
card                 : #1e293b
card (secondary)     : #243244
text                 : #e2e8f0
text (dim)           : #cbd5e1
muted                : #94a3b8
muted (darker)       : #64748b
border               : #334155
accent mint (PIN)    : #6ee7b7
```

### Light theme
```
page/app background : #f5f6fb
card                 : #ffffff
card (secondary)     : #eef0fa
text                 : #0f172a
text (dim)           : #1e293b
muted                : #64748b
muted (darker)       : #94a3b8
border               : #e2e8f0
accent mint (PIN)    : #059669
```

### Brand / semantic colors (same in both themes)
```
Primary gradient (indigo→blue)   : #6c63ff → #3b82f6   (Registration, primary CTAs)
Success gradient (green)        : #22c55e → #16a34a   (Member check-in, confirm actions)
Warning/leader gradient (amber) : #f59e0b → #fbbf24   (Leader check-in)
Danger/absent gradient          : #ef4444 → #f59e0b   (Absent-today hero card)
Visitor/purple gradient         : #a855f7 → #6c63ff   (Visitor path)
Success solid                   : #22c55e
Danger solid                    : #ef4444
Info solid                      : #3b82f6
WhatsApp tint                    : rgba(34,197,94,0.15) bg / #22c55e text
SMS tint                         : rgba(59,130,246,0.15) bg / #3b82f6 text
```

### Typography
- Font stack: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` (system-safe stack used in the prototype; recreate with the platform's standard system font — SF Pro / Roboto — rather than importing this exact stack).
- Weights used: 600 (labels), 700 (body/buttons), 800–900 (headings, big numbers).
- Scale: 11–13px (labels/meta), 14–16px (body/buttons), 17–22px (section headings), 24–34px (hero numbers/title), 42–56px (big stat displays e.g. Absent count).

### Spacing & shape
- Screen horizontal padding: 18px (24px on PIN screen).
- Card radius: 12–24px depending on prominence (small rows ~12px, hero cards ~22–24px).
- Standard gap between stacked elements: 8–14px.

### Motion
- Card flip: `transform-style: preserve-3d`, `backface-visibility: hidden`, 0.6s transform transition, `perspective: 1000–1400px` on the wrapper.
- Overlay entrance: `jgFlipIn` — rotateX(-90deg)→0 with opacity fade, 0.4s ease-out.
- Button press: `perspective(600px) rotateX(12deg) scale(0.96)` + brightness(0.92) on `:active`, 0.15s.
- Confetti fall: `jgFall` — translateY(-40px→420px) + rotate(360deg) + fade, 2.4–4s loop, staggered delay.
- Pop-in (reward checkmark, hero title): `jgPop` — scale(0.3)→1.08→1 with slight rotation, cubic-bezier overshoot.
- PIN error shake: `jgShake` — translateX oscillation, 0.4s.

---

## Interaction rules worth preserving exactly
- **Admin navigation is strictly one-screen-at-a-time**: opening any admin section is a full-screen takeover; nothing from the level above remains visible or tappable until the user closes it. Do not go back to a tile-grid/flip-in-place pattern.
- **Message template reuse**: a template used for a specific person+channel shows as struck-through/disabled on future visits, but is never deleted from the list (next week a different person may need it).
- **SMS never carries the event poster image** — it must be auto-converted to text-only content when sent via SMS, even though the same event might also go out with the image over WhatsApp.
- **Mood selection needs visible confirmation** (highlighted/selected state) immediately on tap — this was an explicit bug fix, don't regress it.
- Theme toggle and back button are global chrome — present (or intentionally hidden, e.g. back button hidden on Home/Reward) on every screen, top corners.

---

## Full prototype source

The complete design-tool source for this prototype lives in the project as **`Youth Portal.dc.html`**. It's built on a proprietary component runtime (template holes like `{{ x }}`, custom `<sc-if>`/`<sc-for>` control-flow tags, a `support.js` runtime script) — treat it as a **behavior and layout reference only**. Read it directly for exact conditions, state shape, and copy; don't attempt to run or port the file verbatim.

Key structural facts to help a developer navigate it:
- Single-file component with one `state` object covering: current screen, theme, PIN entry, check-in search/flip state, registration form + step index + variant, admin overlay key, messaging sub-flow state, event-creation form, and per-person mood/message-used tracking.
- Screens are toggled via `state.screen` (`home`, `pin`, `checkin`, `register`, `reward`, `admin`, `memberDetail`).
- Admin sub-navigation is a second piece of state, `state.adminOverlay` (`null`, `absent`, `people`, `leaders`, `event`, `comms`, `data`), fully independent of `state.screen`.
- Mock data: `MEMBERS` (6 sample people with attendance history, guardian info, comms log), `LEADERS` (3 sample leaders with PIN + attendance %), `MESSAGE_TEMPLATES` (4 canned outreach messages), `ADDRESS_MOCK` (9 fake SA addresses for the autocomplete simulation).

A developer implementing this for real should replace all mock arrays with actual data-layer calls (member records, attendance, guardian contacts, message history) and wire the WhatsApp/SMS "send" actions to a real messaging provider (e.g. Twilio, WhatsApp Business API).
