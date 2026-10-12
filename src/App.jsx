import { useEffect } from 'react';
import { matchPath, navigate, useLocation } from './lib/router';
import { useSession } from './lib/hooks';
import { useAuthReady } from './lib/auth';
import PublicLayout from './components/layout/PublicLayout';
import AppShell from './components/layout/AppShell';
import Landing from './pages/public/Landing';
import Opportunities from './pages/public/Opportunities';
import JobDetail from './pages/public/JobDetail';
import InfoPage from './pages/public/InfoPage';
import Brand from './pages/public/Brand';
import { t } from './i18n';
import { Login, Signup } from './pages/auth/Auth';
import Onboarding from './pages/auth/Onboarding';
import Overview from './pages/app/Overview';
import Applications, { ApplicationDetail } from './pages/app/Applications';
import Assessments, { AssessmentRunner } from './pages/app/Assessments';
import Projects, { ProjectWorkspace } from './pages/app/Projects';
import { Help, Notifications, Profile, Settings } from './pages/app/Account';
import {
  AdminAnnouncements, AdminApplications, AdminAssessments, AdminContributors, AdminJobs, AdminOverview, AdminProjects,
} from './pages/admin/Admin';

// layout: 'public' | 'bare' | 'app' | 'admin'. `auth` = must be signed in; `role` restricts access.
const ROUTES = [
  { path: '/', layout: 'public', render: () => <Landing /> },
  { path: '/opportunities', layout: 'public', render: () => <Opportunities /> },
  { path: '/opportunities/:id', layout: 'public', render: ({ id }) => <JobDetail id={id} /> },
  { path: '/page/:slug', layout: 'public', render: ({ slug }) => <InfoPage slug={slug} /> },
  { path: '/brand', layout: 'public', render: () => <Brand /> },

  // Clerk renders its own steps (verification, factor-two, SSO callback…) under these prefixes.
  { path: '/login/*', layout: 'bare', guest: true, render: () => <Login /> },
  { path: '/signup/*', layout: 'bare', guest: true, render: () => <Signup /> },
  { path: '/continue', layout: 'bare', auth: true, render: () => null }, // post-sign-in hand-off, always redirects
  { path: '/forgot-password', layout: 'bare', render: () => null, to: '/login' },
  { path: '/verify-email', layout: 'bare', render: () => null, to: '/continue' },
  { path: '/onboarding', layout: 'bare', auth: true, role: 'contributor', render: () => <Onboarding /> },

  { path: '/app', layout: 'app', crumb: 'Overview', render: () => <Overview /> },
  { path: '/app/opportunities', layout: 'app', crumb: 'Find Opportunities', render: () => <Opportunities inApp /> },
  { path: '/app/opportunities/:id', layout: 'app', crumb: 'Opportunity', render: ({ id }) => <JobDetail id={id} inApp /> },
  { path: '/app/applications', layout: 'app', crumb: 'My Applications', render: () => <Applications /> },
  { path: '/app/applications/:id', layout: 'app', crumb: 'Application', render: ({ id }) => <ApplicationDetail id={id} /> },
  { path: '/app/projects', layout: 'app', crumb: 'My Projects', render: () => <Projects /> },
  { path: '/app/projects/:id', layout: 'app', crumb: 'Workspace', render: ({ id }) => <ProjectWorkspace id={id} /> },
  { path: '/app/assessments', layout: 'app', crumb: 'Assessments', render: () => <Assessments /> },
  { path: '/app/assessments/:id', layout: 'app', crumb: 'Assessment', render: ({ id }) => <AssessmentRunner id={id} /> },
  { path: '/app/profile', layout: 'app', crumb: 'My Profile', render: () => <Profile /> },
  { path: '/app/notifications', layout: 'app', crumb: 'Notifications', render: () => <Notifications /> },
  { path: '/app/help', layout: 'app', crumb: 'Help & Support', render: () => <Help /> },
  { path: '/app/settings', layout: 'app', crumb: 'Settings', render: () => <Settings /> },

  { path: '/admin', layout: 'admin', crumb: 'Overview', render: () => <AdminOverview /> },
  { path: '/admin/jobs', layout: 'admin', crumb: 'Opportunities', render: () => <AdminJobs /> },
  { path: '/admin/applications', layout: 'admin', crumb: 'Application Review', render: () => <AdminApplications /> },
  { path: '/admin/contributors', layout: 'admin', crumb: 'Contributors', render: () => <AdminContributors /> },
  { path: '/admin/assessments', layout: 'admin', crumb: 'Assessments', render: () => <AdminAssessments /> },
  { path: '/admin/projects', layout: 'admin', crumb: 'Project Tracking', render: () => <AdminProjects /> },
  { path: '/admin/announcements', layout: 'admin', crumb: 'Announcements', render: () => <AdminAnnouncements /> },
];

function resolve(path) {
  for (const r of ROUTES) {
    const params = matchPath(r.path, path);
    if (params) return { route: r, params };
  }
  return null;
}

/** Decide where (if anywhere) the current user must be redirected for this route. */
export function postAuthPath(user, next) {
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  if (user.role === 'admin') return safeNext?.startsWith('/admin') ? safeNext : '/admin';
  if (!user.onboarded) return `/onboarding${q}`;
  return safeNext || '/app';
}

function redirectFor(route, user, path, query) {
  if (route.to) return route.to;
  const needsAuth = route.auth || route.layout === 'app' || route.layout === 'admin';
  if (needsAuth && !user) return `/login?next=${encodeURIComponent(path)}`;
  if ((route.guest || route.path === '/continue') && user) return postAuthPath(user, query.get('next'));
  if (!user) return null;
  if (route.layout === 'admin' && user.role !== 'admin') return '/app';
  if ((route.layout === 'app' || route.role === 'contributor') && user.role === 'admin') return '/admin';
  if (route.layout === 'app' && !user.onboarded) return '/onboarding';
  return null;
}

export default function App() {
  const { path, query } = useLocation();
  const user = useSession();
  const ready = useAuthReady();
  const match = resolve(path);
  // Public pages render immediately; everything else waits until the Clerk session is known.
  const waiting = !ready && match && match.route.layout !== 'public';
  const redirect = match && !waiting && redirectFor(match.route, user, path, query);

  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true });
  }, [redirect]);

  if (!match)
    return (
      <PublicLayout>
        <InfoPage slug="404" />
      </PublicLayout>
    );
  if (waiting) return <div className="page-loading" role="status" aria-label={t('Loading')}><span className="spinner" /></div>;
  if (redirect) return null;

  const { route, params } = match;
  const page = route.render(params);
  if (route.layout === 'public') return <PublicLayout>{page}</PublicLayout>;
  if (route.layout === 'app') return <AppShell crumb={route.crumb}>{page}</AppShell>;
  if (route.layout === 'admin') return <AppShell admin crumb={route.crumb}>{page}</AppShell>;
  return page;
}
