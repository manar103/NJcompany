# VERALINK

**Connect Talent. Power AI.** A React platform for global AI work opportunities: public site, opportunity discovery, sign-in and onboarding, a contributor dashboard, assessments, project workspaces, and an admin console. Available in **English and Arabic (RTL)**, with **light and dark** themes.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

The app uses normal URL paths (`/opportunities`, `/login`, …). When you deploy `dist/`, configure the host to serve `index.html` for unknown paths (SPA fallback).

## Sign-in with Clerk

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com) and copy its **Publishable key**.
2. Put it in `.env` (see `.env.example`):
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
3. Restart `npm run dev`.

Clerk handles sign-up, sign-in, email verification, password reset, social logins and two-step verification. Its screens appear in Arabic when the site language is Arabic and follow the dark theme.

### Admin account

A signed-in user gets the admin console (`/admin`) when either:

- their email is listed in `VITE_ADMIN_EMAILS` in `.env` (comma-separated), or
- in the Clerk dashboard → **Users** → the user → **Metadata**, their *public* metadata is `{ "role": "admin" }`.

Everyone else is a contributor. The role check runs in the browser; once a real backend exists, enforce it on the server too (verify the Clerk session token and read the role from Clerk).

## Language and theme

- The globe button switches English ⇄ العربية. The choice is remembered per browser; the first visit follows the browser language. Arabic switches the whole layout to right-to-left.
- The sun/moon button picks Light, Dark or System.
- UI strings are wrapped in `t('English text')`; Arabic lives in `src/i18n/ar/ui.js` (interface) and `src/i18n/ar/content.js` (categories, countries, listings, assessments). A missing translation falls back to English.

## Structure

```
src/
  styles/        tokens.css (colour, type, space, radius), base, components, layout, pages
  components/
    ui/          design-system primitives: Button, Badge/StatusBadge, Field+inputs, Dialog,
                 Drawer, Dropdown, Tabs, Accordion, Toast, Alert, Empty/Error states, Progress, Stepper
    layout/      PublicLayout, AppShell (contributor + admin), Preferences (language + theme)
    jobs/        JobCard, FilterPanel, ApplyDialog
    profile/     LanguageEditor, TagSelect, WorkloadPicker, ResumePicker
    workspace/   Recorder (real mic check), per-task workspaces
  pages/
    public/      Landing, Opportunities, JobDetail, Brand (design system), InfoPage
    auth/        Login, Signup (Clerk components), Onboarding
    app/         Overview, Applications (+detail/timeline), Assessments (+runner), Projects (+workspace), Account
    admin/       Overview, Jobs, Application review, Contributors, Assessments, Projects, Announcements
  data/          constants (enums), jobs + assessments, seed (demo users), tasks (workspace samples)
  services/      api.js (async API facade), store.js (localStorage stand-in for the database)
  i18n/          t() / tx() helpers, Arabic dictionary
  lib/           router (history router), auth (Clerk bridge), theme, hooks (useQuery, useStore, useSession), format helpers
```

## Connecting a real backend

Screens only call the async functions in `src/services/api.js` (`jobs.list`, `applications.submit`, `assessments.submit`, `admin.decide`, …). To integrate a backend such as Django REST Framework, replace those functions with HTTP calls. Their names and data shapes match REST resources (`/jobs/`, `/applications/`, `/projects/`, `/notifications/`), and status keys like `under_review` match typical serializer choices. Components do not need to change.

## What is real and what is simulated

| Feature | In this prototype |
| --- | --- |
| Search, filters, sorting, tabs, dialogs, drawers, form validation | Real (client-side) |
| Sign-up / log-in | Real, via Clerk |
| Email verification, password reset | Real, via Clerk |
| Contact form | Validated only; no message is sent yet |
| Applications, drafts, withdrawals, admin decisions, notifications | Simulated in localStorage |
| Assessment answers, save-and-continue | Saved locally, not scored |
| Microphone check and recording | Real browser recording; audio stays on the device, nothing is uploaded |
| Transcription audio | Played with the browser's text-to-speech in place of project files |
| Resume upload, photo collection | Not implemented: only the file name is kept, and the UI explains why |
| Payments and compensation amounts | Not shown or processed. Listings show compensation type only |
| "Download my data" | Real: exports the local profile and applications as JSON |
