

# Plan: SST Color Scheme Customization

## Overview
Add a color theme picker for SST managers, allowing them to choose between 4 color schemes (Navy Blue, Green, Orange, Purple) that apply across their dashboards, their companies' dashboards, and their public landing page (`/sst/:slug`).

## Database Change
- Add `brand_color` column to `sst_managers` table (text, nullable, default null)
- Values: `'navy'`, `'green'`, `'orange'`, `'purple'`, or null (defaults to green/current)

## Color Definitions

```text
Theme       | Primary (dark) | Primary (mid) | Primary (light/bg) | Gradient from/via/to
------------|----------------|---------------|--------------------|---------------------
navy        | #1e3a5f        | #2563eb       | #eff6ff / #dbeafe  | navy-900 → blue-800 → blue-700
green       | #166534        | #15803d       | #f0fdf4 / #dcfce7  | (current green-800 scheme)
orange      | #9a3412        | #ea580c       | #fff7ed / #ffedd5  | orange-900 → orange-700 → orange-600
purple      | #581c87        | #7c3aed       | #faf5ff / #ede9fe  | purple-900 → purple-700 → violet-600
```

## WhiteLabelContext Extension
- Add `brandColor` state (`'navy' | 'green' | 'orange' | 'purple' | null`)
- Fetch `brand_color` alongside `logo_url, name, slug` in all queries
- Expose `brandColor` and a `setBrandColorDB` function to save the selection
- When `brandColor` is set, inject CSS custom properties on `<html>` to override `--primary`, `--secondary`, `--accent` HSL values dynamically

## CSS Variable Approach
Instead of replacing every hardcoded `green-700` class across 39 files, create a **CSS variable-based theming layer**:
- Define `--sst-primary`, `--sst-primary-dark`, `--sst-primary-light`, `--sst-primary-50` CSS variables
- Create utility classes: `.sst-bg-primary`, `.sst-text-primary`, `.sst-border-primary`, etc.
- Replace hardcoded green classes in SST-related pages (SSTDashboard, SSTLandingPage, SSTCompanyCounter, Dashboard when viewed by SST-assigned company, Navbar SST buttons)
- The WhiteLabelContext applies the chosen color palette by setting these CSS variables on the root element

## UI: Color Picker Button
- Add a **Palette icon button** in Navbar, next to "Portal do Parceiro" button (visible only for `role === 'sst'`)
- Opens a **Popover** with 4 color circles (Navy, Green, Orange, Purple) + labels
- Clicking a color saves it to `sst_managers.brand_color` via Supabase update and updates context immediately
- Selected color shows a checkmark overlay

## Files to Modify

1. **Migration** - Add `brand_color text` column to `sst_managers`
2. **`src/contexts/WhiteLabelContext.tsx`** - Add `brandColor`, fetch it, apply CSS variables to `document.documentElement`
3. **`src/components/Navbar.tsx`** - Add Palette button with Popover for SST users
4. **`src/index.css`** - Add SST theme CSS variables and utility classes
5. **`src/pages/SSTDashboard.tsx`** - Replace hardcoded `green-*` classes with CSS variable-based classes
6. **`src/pages/SSTLandingPage.tsx`** - Replace `audit-primary/dark/accent/secondary` gradient with dynamic color classes
7. **`src/components/sst/SSTCompanyCounter.tsx`** - Use theme-aware classes
8. **`src/pages/Dashboard.tsx`** - When white-label is active, use themed colors for `audit-primary` references

## SSTLandingPage Gradient
The hero section gradient (`from-audit-dark via-audit-primary to-audit-accent`) will be replaced with inline styles using the CSS variables, so it dynamically reflects the chosen color scheme.

## Scope
- Only SST-related pages and pages viewed by companies assigned to an SST manager are affected
- Admin pages, the main SOIA landing page, and non-SST company pages remain unchanged
- The color picker is only available to SST role users

