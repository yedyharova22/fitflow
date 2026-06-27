# App nav bar — changes

**Branch:** `feature/app-nav-bar` (merged via initial repo push)  
**Status:** merged  
**Date started:** 2026-06-19

## Goal

Unify duplicated top bars into one FitFlow-branded navigation with mobile hamburger drawer, avatar profile button, and consistent nav across authenticated pages.

## Scope

| Area | Changes |
|------|---------|
| **Web** | `AppNavBar`, `FitFlowLogo`, `ProfileNavButton`, `nav-config.ts`; wired into dashboard, discover, bookings, profile |
| **Assets** | `public/icons/logo.svg`, PWA icons 192/512 |
| **Docs** | Root layout metadata → FitFlow |

## Key files

- `apps/web/src/components/AppNavBar.tsx` — main bar + mobile drawer
- `apps/web/src/components/FitFlowLogo.tsx` — logo + wordmark
- `apps/web/src/components/ProfileNavButton.tsx` — avatar + Profile link
- `apps/web/src/components/nav-config.ts` — role-based nav items
- `apps/web/src/app/dashboard/layout.tsx` — uses shared bar

## How to test

1. Log in as **coach** → desktop: Clients / Workouts / Bookings; mobile: hamburger drawer.
2. Log in as **client** → Dashboard / Discover / My bookings in nav.
3. Profile page shows same bar; avatar reflects upload or initial.
4. Active route highlighted on desktop and in drawer.

## Follow-ups / out of scope

- Bottom tab bar on mobile
- Avatar dropdown (logout, settings)
- Dark mode logo variant
