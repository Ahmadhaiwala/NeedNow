# NeedNow — Design System

Component-level UI spec. Every value here is either taken directly from what you supplied (palette images, Nitec reference) or your stated preferences (rounded/geometric sans, heavy rounded corners + bento grid). Anything not covered below is **not yet decided** — build it, then we add it here rather than guessing.

**Palette v2 (current):** your first palette (Navy/Teal/Sky/Beige) is replaced by the new 7-color system below, built for light + dark mode. Exact hex values were sampled directly from your uploaded swatch image, not estimated.

---

## 1. Color Tokens

Source: your second palette image ("Core / Juice / Cloud" + "Pink / Heat / Jade / Sky").

### Neutrals

| Token           | Hex       | Role                                                                                                      |
| --------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `--color-core`  | `#1F3635` | Dark-mode background; light-mode primary text/ink                                                         |
| `--color-cloud` | `#FCFBF4` | Light-mode background; dark-mode primary text                                                             |
| `--color-juice` | `#CACE00` | Primary accent — CTAs, active states, highlights (same slot the lime accent held in your Nitec reference) |

### Signal colors (each has a light-mode and dark-mode shade)

| Token          | Light shade | Dark shade | Proposed role                                                    |
| -------------- | ----------- | ---------- | ---------------------------------------------------------------- |
| `--color-heat` | `#E73F3C`   | `#B11E1B`  | Error / destructive / urgent                                     |
| `--color-jade` | `#025A5C`   | `#014547`  | Success / positive / secondary CTA                               |
| `--color-sky`  | `#7BA3CE`   | `#51739A`  | Info / links / selected state                                    |
| `--color-pink` | `#E9BAC3`   | `#CE9AA5`  | Tertiary highlight / decorative accent (least functional weight) |

_Role mapping above is a standard convention (red=error, teal-green=success, blue=info), not something you specified — swap any of it if you had a different intent for these four._

### Light / Dark mode mapping

| Token                                                            | Light mode                                        | Dark mode                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--bg-page`                                                      | `--color-cloud`                                   | `--color-core`                                                                                         |
| `--bg-surface` (cards)                                           | `#FFFFFF` (or `--color-cloud` for subtle variant) | `#294845` (Core, lightened ~1 step — not sampled, placeholder until you confirm a dark-mode card tone) |
| `--text-primary`                                                 | `--color-core`                                    | `--color-cloud`                                                                                        |
| `--text-secondary`                                               | `--color-core` @ 65% opacity                      | `--color-cloud` @ 65% opacity                                                                          |
| `--accent-primary`                                               | `--color-juice`                                   | `--color-juice` (unchanged — lime holds contrast on both)                                              |
| `--color-heat` / `--color-jade` / `--color-sky` / `--color-pink` | light shade                                       | dark shade                                                                                             |

**Usage rules:**

- Juice is the _only_ primary accent — used the same way Nitec used its lime CTA (primary buttons, active nav item, key highlights). Don't dilute it by using Heat/Jade/Sky/Pink for primary actions.
- Heat/Jade/Sky/Pink are functional/secondary — reserve for the roles above, not decoration.
- Core and Cloud invert between modes (background ↔ text) rather than being fixed to one role — this is what makes dark mode a straight token swap instead of a rebuild.
- Dark-mode card surface (`#294845`) is a **placeholder**, not sampled from anything you gave me — flag this before you build dark-mode cards and we'll nail it down properly (likely needs a couple of dark-surface elevation steps, not just one).

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

| Token             | Value                               |
| ----------------- | ----------------------------------- |
| `--shadow-card`   | `0 4px 16px rgba(31, 54, 53, 0.08)` |
| `--shadow-hover`  | `0 8px 24px rgba(31, 54, 53, 0.12)` |
| `--shadow-button` | `0 2px 8px rgba(31, 54, 53, 0.15)`  |

_Shadow color is `--color-core` at low opacity — needs a dark-mode-specific version once you confirm dark-mode surfaces (see open item below)._

No borders as the primary card separator — separation comes from shadow + background color contrast (white/sky card on beige page), consistent with the reference.

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

- Background: `--bg-surface` or `--color-sky` (light shade, alternating)
- Radius: `--radius-lg`
- Shadow: `--shadow-card`, → `--shadow-hover` on hover
- Padding: `24px`
- Internal content is left-aligned, generous whitespace — not centered/boxed like a traditional product-grid card

Small stat/utility card (e.g. reference's "5m+ downloads" bubble):

- Circular or pill badge nested inside a card, `--color-core` background, `--color-cloud` text, used for a single highlighted number/stat

---

## 8. Search / Input Fields

Reference shows a pill-shaped search bar in the nav.

- Shape: `--radius-full`
- Background: `--color-sky` (light shade) at low opacity or light neutral fill (not white, to distinguish from cards)
- Height: 44px
- Icon (search/refresh) as a trailing or leading circular affordance, not a plain glyph

Other input types (text fields, dropdowns, textareas for forms like checkout) are **not yet specified** — the reference doesn't show one. Flag when you build your first form and we'll define it rather than assume it matches the search bar.

---

## 9. Navigation Bar

Pattern from reference:

- Fixed-height bar, `--bg-surface` background, `--radius-lg` if floating/inset (not full-bleed edge-to-edge — reference nav sits inside a rounded outer container)
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

---

## 11. Avatars

- Circular, `--radius-full`
- Standard size: 36px (nav), 48px (profile contexts)
- Border: 2px white ring when stacked/overlapping (as in reference's grouped avatars)

---

## What's intentionally NOT decided yet

These aren't in either reference image, so nothing below should be assumed — tell me when you get there:

- ~~Accent color~~ — resolved: Juice fills this role.
- Dark-mode card/surface tone — `#294845` in the color table above is a **placeholder guess**, not sampled from anything you gave me. Confirm or correct before dark-mode cards get built.
- Form field styling (text inputs, dropdowns, checkboxes)
- AI chat bubble styling (user vs. AI message treatment)
- Empty states, error states, loading states
- Dark mode
- Iconography set (which icon library/style)
- Mobile nav pattern (bottom tab bar vs. hamburger)

---

_Update this file as each component is finalized — treat it as the living source of truth, not a one-time spec._
