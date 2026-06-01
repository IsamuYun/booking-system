# 倾听心理 · Lisening — Design System

A design system for **Lisening (倾听心理)**, a psychological-counseling clinic delivered as a **WeChat Mini Program** (微信小程序). The product lets visitors learn about the clinic, browse counseling rooms (photos + details), and check each room's usage / availability across the **past 15 days and the next 15 days**.

> ⚠️ **This system is INFERRED, not derived from source.** No codebase, Figma file, screenshots, logo, or brand guide were provided — only a one-line product description (Simplified Chinese). Everything here (name, colors, type, copy, rooms, photos) is a carefully-crafted, WeChat-conventions-accurate **starting point** built to be corrected. See **Caveats & how to make this real** at the bottom.

---

## Sources given

| Source | Provided? | Notes |
|---|---|---|
| Codebase / front-end repo | ❌ | None attached |
| Figma file | ❌ | None attached |
| Screenshots | ❌ | None uploaded |
| Logo / brand assets | ❌ | None uploaded |
| Product description | ✅ | "一间心理咨询诊所的微信小程序，用户看到诊所的信息和背景资料，查看心理咨询室的照片和信息，查看过去15天和未来15天的咨询室使用状况" |
| Primary language | ✅ | Simplified Chinese (简体中文) |

Because there was no visual source of truth, the UI kit is **not** a recreation of an existing product — it is an original, conventions-driven proposal. Replace it with real assets to turn it into a faithful system.

---

## The brand concept

**倾听 / "Lisening"** reads as *listening* — the founding idea of the clinic. The whole system is built around one feeling: **being heard in a safe, warm, unhurried space.**

- **Voice motif:** an **ear** glyph stands in for "倾听 / listen."
- **Tone:** calm, humane, gently literary — never clinical or cold.
- **Tagline:** 被听见，是改变的开始 ("To be heard is the beginning of change").

---

## CONTENT FUNDAMENTALS

How copy is written across the product.

- **Language & script:** Simplified Chinese throughout. English appears only as a quiet secondary layer — room sub-names (静水室 *Still Water*), the brand latin "Lisening", and section labels in specimens. English is never the primary voice.
- **Person & address:** Speaks *about* the clinic in a warm collective "我们" (we) and addresses the visitor as "你" (informal you), e.g. 「我们陪伴你一起，听见那些尚未被说出口的情绪。」 Warm, not corporate; never the stiff "您" of officialdom, never the marketing "您将获得".
- **Tone:** reassuring, unhurried, plainspoken. Short declarative sentences. Avoids jargon and diagnosis-speak. Example: 「我们不急于给出答案。」
- **Casing & punctuation:** full-width Chinese punctuation (，。「」·). The middot `·` separates meta items (上海 · 静安 · 每日 09:00–21:00). Latin uses normal casing; UPPERCASE only for tiny specimen labels (DISPLAY, BODY).
- **Numbers:** half-width, tabular. Times as `09:00–21:00`. Counts as 「5 间」「12 位」. Date as 「5月18日 · 周三」.
- **Emoji:** **none.** Out of register for a mental-health setting. Meaning is carried by line icons + color, never emoji.
- **Microcopy honesty:** availability is framed as guidance, not a transaction — 「预约由前台人工确认，使用状况仅供参考」. The product informs; it does not hard-sell bookings.
- **Vibe in three words:** safe · warm · attentive.

---

## VISUAL FOUNDATIONS

The low-level visual language. Tokens live in `colors_and_type.css`; specimens in `preview/`.

### Color
- **Primary — vivid teal-green** (`--green-500 #148F77`, deep `--green-700 #0C5F4F`). Fresh, clean, healing. This **replaces WeChat's system green** (#07C160) as the brand color; the WeChat green is kept only in `--wx-green` for rare native-feeling controls.
- **Accent — warm clay / terracotta** (`--clay-500 #C26B4C`). A touch of human warmth against the cool teal. Used *sparingly*: the "busy" room state and occasional photo variety. Never a primary action color.
- **Base is WHITE.** The app and cards both sit on white `#FFFFFF`; cards float via a soft shadow plus a faint teal hairline ring (baked into `--shadow-card`). Clean and clinical-fresh — the **theme is white + teal**.
- **Status system (rooms):** free 空闲 (teal), busy 已预约 (clay), rest 休息 (warm gray). Each has a soft `-bg` fill and a saturated `-dot`. See `preview/color-status.html`.
- **Imagery vibe:** photo placeholders use teal tints (with a clay variant for variety). Real photography should read **soft, natural-light, lived-in** — wood, plants, textiles.

### Typography
- **Serif for soul, sans for system.** Headings, clinic name and pull-quotes use **Noto Serif SC** (humanist, trustworthy, literary). Body, UI, labels and numbers use **Noto Sans SC** (clean, neutral).
- **Numbers** use tabular figures (`.t-num`, `font-variant-numeric: tabular-nums`) so times and dates align in the calendar.
- **Scale** (mobile px): display 30 · h1 22 · h2 17 · h3 15 · body 15 · secondary 13 · caption 12. Body line-height 1.6. Nothing below 12px. See `preview/type-scale.html`.

### Spacing, radii, elevation
- **Spacing:** 4px base (4/8/12/16/20/24/32/40). Page gutter = 16px (`--sp-4`).
- **Radii:** cards 12px (`--r-md`), large media 16–20px, controls fully pill (`--r-pill`). Friendly, soft, never sharp.
- **Elevation:** shadows are **soft and low**, warm-tinted (`rgba(42,46,44,…)`), never harsh black. Three steps: card / raise / float. Cards lean on shadow + generous radius rather than borders; hairlines (`--line`) only separate list rows.

### Backgrounds, borders, surfaces
- **No busy backgrounds.** Flat white fields. The one rich surface is the **hero gradient** (deep teal with soft radial glows of mint + white) — used for the home header and room-detail photo overlay. No repeating patterns, no noise, no heavy gradients elsewhere.
- **Cards:** white, 12px radius, soft shadow, no border. Full-bleed photo at top where present.
- **Transparency / blur:** used for chrome that floats over imagery — the WeChat capsule, the bottom tab bar (frosted white blur), and the nav bar over the hero. Elsewhere surfaces are opaque.

### Motion & states
- **Motion is minimal and gentle.** Tokens: `--dur-fast 140ms / --dur-base 220ms`, eased with `--ease-out`. Tasteful fades/short slides only — no bounces, no spring, nothing playful that would undercut the calm.
  - ⚠️ Entrance keyframe animations were intentionally **removed** from the kit because the preview/capture sandbox freezes CSS animations at frame 0 (leaving `opacity:0` content invisible). Screens are visible at rest. Re-introduce animations carefully in production where the runtime is real.
- **Hover:** not a primary concern on touch; web specimens darken/tint slightly.
- **Press (`:active`):** controls **scale to 0.97** and primary buttons deepen to `--green-700`. Rows/cards get a faint ink wash (`.tappable:active`). Quiet, physical, reassuring.

### Layout rules
- WeChat Mini Program frame: native **status bar**, a **navigation bar** with centered title + the signature **capsule button** (••• ◯) pinned top-right, and a frosted **bottom tab bar** (3 tabs: 首页 / 咨询室 / 关于). Sub-pages (room detail) push with a back chevron and hide the tab bar.
- Content scrolls between fixed nav and tab bar. Touch targets ≥ 44px.

---

## ICONOGRAPHY

- **Style:** clean **line icons**, 24px grid, ~1.75 stroke, round caps/joins — matching **Lucide**'s geometry. Friendly and modern without being childish.
- **Implementation:** a curated inline-SVG set lives in `ui_kits/miniprogram/Icons.jsx` (exports `<Icon name=… />`). Static preview cards inline the same paths.
- ⚠️ **SUBSTITUTION:** the clinic's real icon set is unknown, so these are **Lucide-style stand-ins**. If the Mini Program uses WeUI/Weixin icons or a custom set, swap `Icons.jsx`. The brand-specific **ear** glyph (倾听 motif) is the one semi-custom mark and should be replaced by the real logo mark if one exists.
- **Emoji:** never used. **Unicode symbols:** avoided except the middot `·` as a separator.
- **Color:** icons inherit `currentColor`; primary actions/spec tiles use `--color-primary`, meta uses `--color-fg3`.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — context, content & visual foundations, iconography, index |
| `colors_and_type.css` | All design tokens: base + semantic colors, type families & scale, radii, spacing, elevation, motion. Loads Noto fonts from Google Fonts. |
| `SKILL.md` | Agent-Skill manifest so this system can be used in Claude Code |
| `preview/` | 17 Design-System cards (color, type, spacing, components, brand) shown in the Design System tab |
| `ui_kits/miniprogram/` | The WeChat Mini Program UI kit — see its own `README.md` |
| `ui_kits/miniprogram/index.html` | **Interactive prototype** (home · rooms · about · room detail with the 30-day usage calendar) |

### UI kits
- **`ui_kits/miniprogram/`** — the only product surface. Components: `Chrome` (WeChat nav + capsule + tab bar), `Icons`, `Primitives` (cards, chips, badges, list rows, spec tiles, stats, photo placeholder), `UsageCalendar` (signature 30-day availability), and four screens (`HomeScreen`, `RoomsScreen`, `AboutScreen`, `RoomDetailScreen`).

---

## Fonts

CJK fonts are large, so **Noto Sans SC** and **Noto Serif SC** are loaded from Google Fonts (subsetted over the network) via an `@import` in `colors_and_type.css` rather than bundled into `fonts/`. ⚠️ If the clinic has a licensed brand typeface, drop the files into a `fonts/` folder and update the `--font-*` tokens.

---

## ⚠️ Caveats & how to make this real

This is a **proposal**, not a recreation. To make it accurate, please share any of:

1. **The Mini Program source** (the `miniprogram/` WXML/WXSS/JS or a Taro/uni-app repo) — the single most valuable input. Re-attach via the **Import** menu.
2. **A Figma file** (with view access) of the design.
3. **Screenshots** of the real home / rooms / room-detail / availability screens.
4. **The real logo**, brand colors, and any brand/tone guide.
5. **Real room names, copy, and photos**, and how availability is actually displayed (a strip? a month grid? per-hour?).

Until then, treat the brand name (倾听心理 / Lisening), the sage-green palette, the room list, and all copy as **placeholders to react to**.
