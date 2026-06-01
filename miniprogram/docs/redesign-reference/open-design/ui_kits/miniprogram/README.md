# UI Kit — 倾听心理 WeChat Mini Program

A high-fidelity, interactive recreation of the Lisening counseling-clinic Mini Program. ⚠️ **Inferred** from a one-line product brief (no source code/Figma/screenshots) — an original proposal built to WeChat Mini Program conventions, meant to be corrected against the real product.

## Run it
Open `index.html`. React + Babel are loaded from CDN; component files are plain `.jsx` transpiled in-browser. It renders inside an iOS device frame with full WeChat chrome.

## What it demonstrates (click-through)
- **首页 / Home** — branded hero, stats, today's available rooms (horizontal), about preview, visit info. Tap a room → detail.
- **咨询室 / Rooms** — list of counseling rooms with photo, status, capacity/area.
- **关于诊所 / About** — philosophy pull-quote, who-we-are, credentials, visit & contact.
- **Room detail** (pushed page) — photo header + thumbnails, specs, and the **signature usage calendar**: past 15 + next 15 days, tap a day for its hour-by-hour status. No tab bar; back chevron returns.
- Bottom **tab bar** switches the three top-level tabs.

## Files
| File | Role |
|---|---|
| `index.html` | Mounts everything; CDN + script order |
| `ios-frame.jsx` | Device bezel, status bar, home indicator (starter component) |
| `Chrome.jsx` | `WeChatNav` (centered title + capsule ••• ◯ + optional back) · `TabBar` · `Capsule` |
| `Icons.jsx` | `Icon` — curated Lucide-style line set (⚠️ substitute) |
| `Primitives.jsx` | `PhotoPlaceholder` · `SectionHeader` · `StatusBadge` · `InfoRow` · `Stat` · `Tag` · `Avatar` |
| `UsageCalendar.jsx` | `UsageCalendar` — the 30-day availability component |
| `Data.jsx` | `CLINIC` + `ROOMS` placeholder content (Simplified Chinese) |
| `HomeScreen.jsx` / `RoomsScreen.jsx` / `AboutScreen.jsx` / `RoomDetailScreen.jsx` | The four screens |
| `App.jsx` | Tab + room-detail navigation state |
| `kit.css` | Imports tokens; component classes (`.btn`, `.chip`, `.status`, `.card`, `.photo`, …) |

## Conventions / gotchas
- Each `text/babel` script has its own scope; shared components are published with `Object.assign(window, {…})` and consumed as globals. Load order in `index.html` matters.
- The WeChat **capsule** is decorative (recreation, not real WeChat APIs). Navigation is faked in React state.
- **Photos are placeholders** (warm gradient blocks) — drop in real room photography.
- **No entrance animations** — the preview sandbox freezes CSS animations at frame 0; screens render visible at rest. Re-add motion in production.
- All copy, room names, the brand and palette are **placeholders** — replace with the clinic's real material.

## To make it faithful
Provide the Mini Program source (WXML/WXSS/JS, Taro, or uni-app), a Figma file, or screenshots, plus the real logo and how availability is actually visualized. Then this kit can be reworked into an exact recreation.
