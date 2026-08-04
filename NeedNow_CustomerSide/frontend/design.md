# NeedNow — Design System

Component-level UI spec. Every value here is either taken directly from what you supplied (palette images, Nitec reference) or your stated preferences (rounded/geometric sans, heavy rounded corners + bento grid). Anything not covered below is **not yet decided** — build it, then we add it here rather than guessing.

**Palette v2 (current):** your first palette (Navy/Teal/Sky/Beige) is replaced by the new 7-color system below, built for light + dark mode. Exact hex values were sampled directly from your uploaded swatch image, not estimated.

---

## 1. Color Tokens

Source: your second palette image ("Core / Juice / Cloud" + "Pink / Heat / Jade / Sky").

### Neutrals

| Token           | Hex       | Role                                                                                                                                                         |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--color-core`  | `#1F3635` | Dark-mode background; light-mode primary text/ink                                                                                                            |
| `--color-cloud` | `#FCFBF4` | Dark-mode primary text; light-mode **card/surface** color only (see `--color-sand` below for page bg)                                                        |
| `--color-sand`  | `#C9C1AC` | **New.** Light-mode page background — deliberately deeper than Cloud so white/Cloud cards read as a distinct elevated surface, not the same tone as the page |
| `--color-juice` | `#CACE00` | Primary accent — CTAs, active states, highlights (same slot the lime accent held in your Nitec reference)                                                    |

### Signal colors (each has a light-mode and dark-mode shade)

| Token          | Light shade | Dark shade | Proposed role                                                    |
| -------------- | ----------- | ---------- | ---------------------------------------------------------------- |
| `--color-heat` | `#E73F3C`   | `#B11E1B`  | Error / destructive / urgent                                     |
| `--color-jade` | `#025A5C`   | `#014547`  | Success / positive / secondary CTA                               |
| `--color-sky`  | `#7BA3CE`   | `#51739A`  | Info / links / selected state                                    |
| `--color-pink` | `#E9BAC3`   | `#CE9AA5`  | Tertiary highlight / decorative accent (least functional weight) |

_Role mapping above is a standard convention (red=error, teal-green=success, blue=info), not something you specified — swap any of it if you had a different intent for these four._

### Light / Dark mode mapping

| Token                                                            | Light mode                                          | Dark mode                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `--bg-page`                                                      | `--color-sand` (`#C9C1AC`) — **not** Cloud, see §1b | `--color-core` (`#1F3635`)                                |
| `--bg-surface` (cards, elevation 1)                              | `#FFFFFF` (fixed — no longer "or Cloud", see §1b)   | `#3D6A68` — see **Dark Mode Surfaces** below              |
| `--bg-surface-raised` (elevation 2 — modals, dropdowns, sheets)  | `#FFFFFF` with `--shadow-hover`                     | `#487D7B` — see **Dark Mode Surfaces** below              |
| `--text-primary`                                                 | `--color-core`                                      | `--color-cloud`                                           |
| `--text-secondary`                                               | `--color-core` @ 65% opacity                        | `--color-cloud` @ 65% opacity                             |
| `--accent-primary`                                               | `--color-juice`                                     | `--color-juice` (unchanged — lime holds contrast on both) |
| `--color-heat` / `--color-jade` / `--color-sky` / `--color-pink` | light shade                                         | dark shade                                                |

**Usage rules:**

- Juice is the _only_ primary accent — used the same way Nitec used its lime CTA (primary buttons, active nav item, key highlights). Don't dilute it by using Heat/Jade/Sky/Pink for primary actions.
- Heat/Jade/Sky/Pink are functional/secondary — reserve for the roles above, not decoration.
- Core and Cloud invert between modes (background ↔ text) rather than being fixed to one role — this is what makes dark mode a straight token swap instead of a rebuild.

---

## 1a. Dark Mode Surfaces (elevation system)

The old placeholder (`#294845`, single flat tone) is replaced with a proper elevation ramp, so nested/stacked surfaces (card → modal → popover) stay visually distinct without borders.

**How these were derived:** each step keeps `--color-core`'s hue and saturation exactly (177° hue, 27% saturation) and increases _lightness only_.

⚠️ **Revision history:**

1. First pass: even ~4% lightness increments → page↔card contrast of only 1.20:1 (cards invisible against the page).
2. Second pass: widened to +9% → 1.52:1 (workable, but you wanted the card to feel more clearly "lifted").
3. **Current:** pushed further to +16% on `--surface-1` → **2.11:1** against the page — a card now reads as a distinctly separate surface at a glance, not just a faint tint shift.

| Token                   | Hex       | Lightness vs. Core | Contrast vs. previous step | Use                                                      |
| ----------------------- | --------- | ------------------ | -------------------------- | -------------------------------------------------------- |
| `--surface-0` (page bg) | `#1F3635` | base (16.7%)       | —                          | Page background (`--bg-page`)                            |
| `--surface-1` (card)    | `#3D6A68` | +16%               | **2.11 : 1**               | Standard cards, nav bar (`--bg-surface`)                 |
| `--surface-2` (raised)  | `#487D7B` | +22%               | 1.30 : 1                   | Modals, dropdowns, bottom sheets (`--bg-surface-raised`) |
| `--surface-3` (popover) | `#53918E` | +28%               | 1.29 : 1                   | Tooltips, context menus — rarely needed, use sparingly   |

**Note on text contrast — read before building:** pushing the card itself brighter means text/icons sitting _on_ the card have less headroom than before:

| On this surface | Cloud text (body)                                                | Juice (accent/CTA)                                                                        |
| --------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--surface-1`   | 5.85 : 1 ✅ passes AA comfortably                                | 3.57 : 1 — fine for large/bold text, icons; avoid small regular-weight body copy in Juice |
| `--surface-2`   | 4.50 : 1 ✅ exactly at AA threshold                              | 2.75 : 1 — large text/icons only                                                          |
| `--surface-3`   | 3.49 : 1 — large text only, avoid `--text-caption` at 400 weight | 2.12 : 1 — decorative use only, not for readable text                                     |

Practical upshot: `--surface-1` (the one you'll see constantly, every card on every screen) is safe for all your existing type scale. `--surface-2`/`--surface-3` are lower-traffic (modals, tooltips) — keep body copy on those surfaces in Cloud, not Juice, and prefer `--text-h2`/`--text-body` weight over faint captions.

---

## 1b. Light Mode Surfaces (fixing the same collision, in reverse)

Your Orders screen showed the light-mode mirror of the dark-mode problem above. Pulling actual pixel values from the screenshot:

- Page background: `#EDE8DF`
- The "Order #1" / "Order #2" outer card wrapper: `#E8E3DA`

Those are **1.05:1** apart — invisible. The bug: `--bg-surface` was spec'd as "white, _or_ Cloud for a subtle variant," and the order-card wrapper landed on the Cloud-ish variant, which sits almost exactly on top of the page tone (`--color-cloud` is `#FCFBF4`, i.e. near-white — the _page_ was already drifting toward the same near-white territory). Meanwhile the item rows nested inside got pure white, so they visually read as "the card" while the actual card (the thing that should group them) disappears.

**Fix — a new dedicated color, not a reused one:**

| Token          | Hex       | Role                                                                                                     |
| -------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `--color-sand` | `#C9C1AC` | **New palette color.** Light-mode page background, and _only_ the page background — nothing else uses it |

With `--bg-page` = `--color-sand` and `--bg-surface` locked to solid `#FFFFFF` (the "or Cloud" option is removed), page↔card contrast becomes **1.79:1** — a real, visible lift, not a collision. `--color-cloud` (`#FCFBF4`) is reassigned to card/input surfaces only, where it's meant to sit just barely off pure white (e.g. an alternating bento card, or an input fill) — never as the page tone itself.

**Second bug, independent of color:** the nesting itself was inverted. The item rows shouldn't be their own separate white cards floating inside a same-colored wrapper — the _whole_ "Order #1" block (header, item rows, footer buttons) should be **one single white card** with `--radius-lg` and `--shadow-card`, and the rows inside it separated by a plain 1px divider, not a background-color swap:

```css
--divider-row: 1px solid rgba(31, 54, 53, 0.08); /* Core @ 8%, light mode only */
```

This matches how the rest of the system already separates things (shadow + color contrast against the page, not internal color-blocking), and removes the "card inside a card" ambiguity entirely — there's exactly one visual container per order, and rows inside it are just rows.

**Where this applies beyond Orders:** any list-inside-a-card pattern — Pantry inventory rows, Shared Orders participant lists, History entries — should follow the same rule: one card, `--bg-surface` white, internal rows separated by `--divider-row`, never a second nested background color.

---

**Shadows in dark mode:** the light-mode shadow recipe (`--color-core` at low opacity) barely reads against an already-dark background, so it's not reused here. Instead, elevation is communicated by the lightness steps above, optionally paired with a hairline top-highlight border for extra separation on floating elements:

```css
--border-elevation-dark: 1px solid rgba(252, 251, 244, 0.06); /* Cloud @ 6% */
```

Use this border only on `--surface-2` / `--surface-3` elements (modals, popovers) — standard cards on `--surface-1` should rely on the lightness contrast alone, matching the borderless-card convention from light mode.

> **Status: proposed, not sampled.** Unlike the rest of the palette (pulled directly from your swatch image), these four values are computed from `--color-core`, not something you supplied. They're safe to build against as a _system_ (the ramp logic is sound), but treat the exact hex stops as adjustable — nudge lightness up/down to taste once you see real cards on screen, especially if Juice or Sky text/icons feel low-contrast on `--surface-1`.

---

## 2. Typography

Category confirmed: **rounded / geometric sans, soft & friendly.** Two candidate pairings within that category — pick one before components go further, or tell me and I'll lock it in:

- **Option A:** Display — `Fredoka` (rounded, bold, friendly headlines) / Body — `Nunito Sans` (rounded terminals, clean at small sizes)
- **Option B:** Display — `Baloo 2` (chunky rounded) / Body — `Poppins` (geometric, slightly less playful than Nunito)

Until you confirm, treat font-family as a variable (`--font-display`, `--font-body`) — don't hardcode a specific font name into components yet.

**Type scale (based on Nitec reference proportions):**

| Token            | Size       | Weight  | Use                        |
| ---------------- | ---------- | ------- | -------------------------- |
| `--text-hero`    | 48px / 1.1 | 700     | Landing hero headline only |
| `--text-h1`      | 32px / 1.2 | 700     | Page/section titles        |
| `--text-h2`      | 22px / 1.3 | 600     | Card titles                |
| `--text-body`    | 16px / 1.5 | 400–500 | Paragraph, descriptions    |
| `--text-caption` | 13px / 1.4 | 500     | Labels, meta, chip text    |

---

## 3. Layout — Bento Grid

Matches Nitec reference: an asymmetric grid of rounded cards of varying size (large hero card, tall side cards, small stat cards) rather than uniform equal-width columns.

- Grid gap: `16px` between cards, consistent everywhere.
- Cards snap to a base grid — no card is placed with an arbitrary custom size; sizes are multiples of the smallest card unit.
- Outer page padding: `24px` mobile / `40px` desktop.
- Mixed card sizes on a single row are expected (e.g. one large + two stacked small), as in the reference — this is the default landing/dashboard layout pattern, reused for any "overview" screen (not just the homepage).

---

## 4. Border Radius

Confirmed: heavy rounding, matching the reference exactly.

| Token           | Value | Use                                             |
| --------------- | ----- | ----------------------------------------------- |
| `--radius-sm`   | 12px  | Chips, small icon buttons, tags                 |
| `--radius-md`   | 20px  | Inputs, standard buttons                        |
| `--radius-lg`   | 28px  | Cards                                           |
| `--radius-full` | 999px | Pills (search bar, primary CTA buttons, avatar) |

No sharp (0px) corners anywhere in the system.

---

## 5. Elevation / Shadows

Reference uses soft, low-contrast shadows (cards lift gently off the beige background, no hard drop shadows).

| Token             | Light mode value                    | Dark mode value                                                                                             |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--shadow-card`   | `0 4px 16px rgba(31, 54, 53, 0.08)` | none — use `--surface-1` + optional `--border-elevation-dark`                                               |
| `--shadow-hover`  | `0 8px 24px rgba(31, 54, 53, 0.12)` | `0 8px 24px rgba(0, 0, 0, 0.35)` (pure black, higher opacity — reads better on dark bg than tinted shadows) |
| `--shadow-button` | `0 2px 8px rgba(31, 54, 53, 0.15)`  | `0 2px 8px rgba(0, 0, 0, 0.4)`                                                                              |

No borders as the primary card separator in light mode — separation comes from shadow + background color contrast (white/sky card on beige page). In dark mode, separation comes primarily from the elevation lightness ramp (§1a), with shadows reserved for hover/press states and floating elements where a black shadow still reads clearly.

---

## 6. Buttons

Two shapes appear in the reference — both are valid, used contextually:

**Primary pill button** (e.g. "View All Products")

- Shape: `--radius-full`
- Background: `--accent-primary` (Juice) — this resolves the earlier open question: Juice _is_ the bright accent, taken directly from your palette, filling the same role as the lime button in the reference.
- Text: white, `--text-caption` weight 600
- Padding: `16px 24px`
- Trailing icon in a circular white/light inset (matches reference's arrow-in-circle detail)

**Icon button** (circular, e.g. cart/heart/search icons in top nav)

- Shape: `--radius-full`, fixed square dimensions (40px × 40px standard, 48px × 48px for primary actions)
- Background: `--bg-surface` on dark/colored surfaces, or `--color-sky` (light shade) on light surfaces
- Icon centered, `--text-primary`

No other button variants are defined yet (no outline/ghost/destructive styles) — add when a screen needs one.

---

## 7. Cards

Base bento card:

- Background: `--bg-surface` or `--color-sky` (light shade, alternating) in light mode; `--surface-1` in dark mode
- Radius: `--radius-lg`
- Shadow: `--shadow-card`, → `--shadow-hover` on hover (dark mode: rely on `--surface-2` on hover instead of/alongside the black hover shadow — bumping elevation reads more clearly than a shadow alone against a dark page)
- Padding: `24px`
- Internal content is left-aligned, generous whitespace — not centered/boxed like a traditional product-grid card

Small stat/utility card (e.g. reference's "5m+ downloads" bubble):

- Circular or pill badge nested inside a card, `--color-core` background, `--color-cloud` text in light mode; in dark mode, invert to `--color-cloud` background / `--color-core` text so the badge still pops against the dark card surface

---

## 8. Search / Input Fields

Reference shows a pill-shaped search bar in the nav.

- Shape: `--radius-full`
- Background: `--color-sky` (light shade) at low opacity or light neutral fill (not white, to distinguish from cards) in light mode; `--surface-2` in dark mode (one step up from the nav bar's `--surface-1`, so the field reads as interactive/recessed rather than blending into the bar)
- Height: 44px
- Icon (search/refresh) as a trailing or leading circular affordance, not a plain glyph

Other input types (text fields, dropdowns, textareas for forms like checkout) are **not yet specified** — the reference doesn't show one. Flag when you build your first form and we'll define it rather than assume it matches the search bar.

---

## 9. Navigation Bar

Pattern from reference:

- Fixed-height bar, `--bg-surface` background (`--surface-1` in dark mode), `--radius-lg` if floating/inset (not full-bleed edge-to-edge — reference nav sits inside a rounded outer container)
- Left: logo/wordmark
- Center: pill search input
- Right: circular icon buttons (cart, wishlist) + user avatar with name label

---

## 10. Chips / Tags / Badges

Reference examples: "Music is Classic" eyebrow tag, "Popular" badge.

| Type         | Shape              | Style                                                                                     |
| ------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| Eyebrow tag  | `--radius-sm` pill | Small icon + `--text-caption`, muted background (`--color-sky` light shade @ low opacity) |
| Status badge | `--radius-sm` pill | Solid color fill (navy or teal) + white text, used to flag "Popular", "New", etc.         |

Dark mode: swap each signal color to its dark shade per §1; muted backgrounds (eyebrow tag) should sit on `--surface-1` or `--surface-2`, not directly on `--surface-0`, so the low-opacity fill has enough contrast to read.

---

## 11. Avatars

- Circular, `--radius-full`
- Standard size: 36px (nav), 48px (profile contexts)
- Border: 2px white ring when stacked/overlapping in light mode; 2px `--surface-1` ring in dark mode (matches the surface behind it rather than staying white, so the ring reads as a gap/separator rather than a bright halo)

---

## What's intentionally NOT decided yet

These aren't in either reference image, so nothing below should be assumed — tell me when you get there:

- ~~Accent color~~ — resolved: Juice fills this role.
- ~~Dark-mode card/surface tone~~ — resolved with the elevation ramp in §1a, but flagged as **computed, not sampled** — treat as a strong starting point to build against, and adjust to taste once real components are on screen.
- Form field styling (text inputs, dropdowns, checkboxes)
- AI chat bubble styling (user vs. AI message treatment)
- Empty states, error states, loading states
- Iconography set (which icon library/style)
- Mobile nav pattern (bottom tab bar vs. hamburger)

---

_Update this file as each component is finalized — treat it as the living source of truth, not a one-time spec._
