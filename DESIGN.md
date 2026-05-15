# Insti Design System

## Overview

Professional, corporate, and minimal design system for the Insti ERP escolar SaaS.
Built on Shadcn/UI (New York style) + TailwindCSS. Conveys trust, authority, and clarity — no playful, no gimmicky.

---

## Colors

### Brand

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Primary | #1E3A5F | `primary` | Sidebar, headers, main actions |
| Primary Light | #2D5A8A | `primary-light` | Hover, active states |
| Primary Dark | #152B47 | `primary-dark` | Depth elements |
| Primary BG | #EEF2F7 | `primary-bg` | Page backgrounds, subtle sections |

### Accent

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Accent | #2563EB | `accent` | Links, focused inputs, highlights |
| Accent Light | #DBEAFE | `accent-light` | Selected rows, info banners |

### Semantic

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Success | #059669 | `success` | Confirmations, paid status |
| Success Light | #D1FAE5 | `success-light` | Success banners |
| Warning | #D97706 | `warning` | Pending, attention |
| Warning Light | #FEF3C7 | `warning-light` | Warning banners |
| Error | #DC2626 | `error` | Deletions, overdue |
| Error Light | #FEE2E2 | `error-light` | Error banners |

### Neutral

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Surface Base | #F8FAFC | `slate-50` | Page background |
| Surface Card | #FFFFFF | `white` | Cards, modals |
| Surface Muted | #F1F5F9 | `slate-100` | Muted sections |
| Border | #E2E8F0 | `slate-200` | Borders, dividers |
| Text Primary | #0F172A | `slate-900` | Headings, body |
| Text Secondary | #475569 | `slate-600` | Labels, captions |
| Text Muted | #94A3B8 | `slate-400` | Placeholders, disabled |

---

## Typography

| Level | Font | Size / Line | Weight | Usage |
|---|---|---|---|---|
| Display | Inter | 36px / 1.2 | 700 | Dashboard hero KPIs |
| h1 | Inter | 28px / 1.3 | 700 | Page titles |
| h2 | Inter | 22px / 1.3 | 600 | Section headers |
| h3 | Inter | 18px / 1.4 | 600 | Card titles |
| Body | Inter | 15px / 1.5 | 400 | Default text |
| Body-sm | Inter | 13px / 1.5 | 400 | Secondary text, labels |
| Caption | Inter | 12px / 1.4 | 500 | Badges, meta, table footers |

Font stack: `'Inter', system-ui, -apple-system, sans-serif`

---

## Spacing

Base unit: **4px** (Tailwind default)

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Icon-to-text gap |
| sm | 8px | Compact gaps |
| md | 16px | Default padding |
| lg | 24px | Section padding |
| xl | 32px | Page padding |
| 2xl | 48px | Section gaps |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Checkbox, badges |
| sm | 6px | Inputs, selects |
| md | 8px | Cards, buttons |
| lg | 12px | Modals, sheets |
| xl | 16px | Large panels |

---

## Shadows

No colored glows. Subtle, natural elevation only.

| Token | Value |
|---|---|
| xs | `0 1px 2px rgb(0 0 0 / 0.04)` |
| sm | `0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)` |
| md | `0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)` |
| lg | `0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04)` |
| xl | `0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.04)` |

---

## Components

Built on **Shadcn/UI — New York style** (`style: "new-york"`).

### Buttons

- Default: `variant="default"` uses primary (#1E3A5F)
- Destructive: `variant="destructive"` uses error (#DC2626)
- Outline: `variant="outline"` for secondary actions
- Ghost: `variant="ghost"` for toolbar actions
- Sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10)
- Radius: `rounded-md` (8px)

### Inputs & Textareas

- Height: h-10 (40px)
- Radius: `rounded-md` (6px effectively via shadcn default)
- Border: `border-slate-200` default, `border-primary` on focus
- Focus ring: `ring-1 ring-primary` (not ring-2, keep minimal)

### Cards

- Background: white
- Border: `border border-slate-200`
- Radius: `rounded-lg`
- Shadow: `shadow-sm`
- Padding: p-6 (24px)
- Header: `font-semibold text-slate-900` with optional `text-sm text-slate-500` description

### Tables

- Full width, sticky header
- Header bg: `bg-slate-50`, text: `text-xs font-medium text-slate-500 uppercase`
- Row height: h-12 (48px) for data rows
- Row hover: `hover:bg-slate-50`
- Borders: horizontal only (`border-b`)
- Pagination: below table, right-aligned

### Data Table (advanced)

When using TanStack Table:
- Select column (checkbox) on the left
- Sorting indicators in column headers
- Column visibility toggle in toolbar
- Row actions (dropdown menu) pinned right

### Modals (Dialog)

- Width: `sm:max-w-md` or `sm:max-w-lg`
- Padding: p-6
- Backdrop: `bg-black/50`
- Close button: top-right, ghost icon button

### Sidebar Navigation

- Width: `w-64` (256px) collapsed: `w-16` (64px)
- Background: primary (#1E3A5F)
- Text: white / white-80
- Active item: primary-light (#2D5A8A) bg with left accent border
- Icons: Lucide React, 20px
- Logo area: 56px height top

### Top Header

- Height: h-14 (56px)
- Background: white, bottom border
- Content: breadcrumb left, user menu right (avatar + dropdown)

### Tabs

- Shadcn Tabs component
- Active tab: bottom border primary, text primary
- Inactive: text-slate-500

### Badges / Status

| Status | Classes |
|---|---|
| Active / Present | `bg-success-light text-success` |
| Pending / Warning | `bg-warning-light text-warning` |
| Inactive / Error | `bg-error-light text-error` |
| Neutral | `bg-slate-100 text-slate-600` |

---

## Layout Patterns

### Dashboard (per role)

```
┌──────────────────────────────────────────┐
│ Header (h-14)          │ user menu ··· │
├────────┬─────────────────────────────────┤
│ Sidebar│ Main Content Area               │
│ w-64   │ ┌─────────┬─────────┬────────┐ │
│        │ │ KPI 1   │ KPI 2   │ KPI 3  │ │
│ Nav    │ └─────────┴─────────┴────────┘ │
│ items  │ ┌──────────────────────────────┐ │
│        │ │ Table / Chart Section        │ │
│        │ └──────────────────────────────┘ │
└────────┴─────────────────────────────────┘
```

### Form Layout

- Single-column for simple forms (max-w-lg)
- Two-column for complex forms (grid-cols-2 gap-6)
- Labels above inputs (not inline)
- Error messages below inputs, `text-sm text-error`
- Submit button aligned right (or full-width on mobile)
- Sections separated by `border-b pb-6 mb-6`

### Empty State

- Centered in the content area
- Icon (Lucide, 48px, text-slate-300)
- Title: `text-lg font-semibold text-slate-900`
- Description: `text-sm text-slate-500 max-w-sm`
- CTA button below description

### Loading State

- Skeleton components (Shadcn Skeleton) matching the shape of the loaded content
- Table loading: 5-8 skeleton rows
- Card loading: block skeleton matching card dimensions

### Error State

- Centered, similar to empty state but with error icon
- Error message from server
- Retry button

---

## Responsive Breakpoints

Tailwind defaults:

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktop |
| `xl` | 1280px | Desktop |

### Behavior

- **Mobile (<768px):** Sidebar hidden → hamburger menu. Single-column layouts. Full-width forms.
- **Tablet (768-1023px):** Sidebar collapsed (icons only). Two-column forms.
- **Desktop (≥1024px):** Full sidebar. Multi-column dashboards.

---

## Do's and Don'ts

1. Do use Shadcn/UI New York style components exclusively.
2. Do use `Inter` as the primary font.
3. Do keep forms single-column on mobile.
4. Do use Lucide React for all icons (consistent 20px or 16px sizes).
5. Do place labels above inputs, not to the left.
6. Do show loading/empty/error states on every data view.
7. Don't use colored shadows or glow effects.
8. Don't use emojis as UI elements (use Lucide icons instead).
9. Don't use pill-shaped buttons (use `rounded-md`).
10. Don't use dashed borders.
11. Don't exceed 500ms for transitions/animations.
12. Don't use `any` in TypeScript — infer from Shadcn/UI prop types.
13. Do ensure touch targets are at least 44px (WCAG AA).
14. Do use `sr-only` for accessible labels on icon-only buttons.
