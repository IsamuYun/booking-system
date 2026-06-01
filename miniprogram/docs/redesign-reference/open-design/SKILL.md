---
name: lisening-design
description: Use this skill to generate well-branded interfaces and assets for Lisening (倾听心理), a psychological-counseling-clinic WeChat Mini Program, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Simplified-Chinese, calm/warm/healing brand.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, the `preview/` cards, and `ui_kits/miniprogram/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Key things to honor:
- **Simplified Chinese** UI; warm collective "我们" / informal "你"; no emoji; full-width punctuation; tabular numbers; "被听见，是改变的开始" tone.
- **Teal-green primary** (`--green-500 #148F77`) replacing WeChat's system green; **warm clay accent** used sparingly; **white** background. Theme: white + teal.
- **Noto Serif SC** for headings/brand, **Noto Sans SC** for body/UI, tabular numerals for times/dates.
- Soft low shadows, 12px card radius, pill controls, `:active` scale 0.97. Minimal gentle motion.
- WeChat chrome: status bar + nav with centered title + capsule (••• ◯) + frosted bottom tab bar.
- Line icons (Lucide-style) via `Icons.jsx`; the **ear** glyph is the 倾听 motif.
- The signature component is the **room usage calendar** (past 15 + next 15 days) in `UsageCalendar.jsx`.

⚠️ This system is **inferred** from a one-line brief — no real source/logo/photos were given. Treat the brand name, palette, room list, and all copy as placeholders. If the user has the real Mini Program source, Figma, logo, or photos, ask for them to make output faithful.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
