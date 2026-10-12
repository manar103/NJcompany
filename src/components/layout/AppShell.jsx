import { useState } from 'react';
import { Link, navigate, useLocation } from '../../lib/router';
import { useSession, useStore } from '../../lib/hooks';
import { useSignOut } from '../../lib/auth';
import { profileCompletion } from '../../services/api';
import { initials } from '../../lib/format';
import { t } from '../../i18n';
import { Drawer, Dropdown, Icon, IconButton, Logo, Progress, useToast } from '../ui';
import Preferences from './Preferences';

const CONTRIBUTOR_NAV = [
  { section: 'Work' },
  { label: 'Overview', to: '/app', icon: 'home', exact: true },
  { label: 'Find Opportunities', to: '/app/opportunities', icon: 'search' },
  { label: 'My Applications', to: '/app/applications', icon: 'clipboard' },
  { label: 'My Projects', to: '/app/projects', icon: 'folder' },
  { label: 'Assessments', to: '/app/assessments', icon: 'target', badge: 'assessments' },
  { section: 'Account' },
  { label: 'My Profile', to: '/app/profile', icon: 'user' },
  { label: 'Notifications', to: '/app/notifications', icon: 'bell', badge: 'notifications' },
  { label: 'Help & Support', to: '/app/help', icon: 'help' },
  { label: 'Settings', to: '/app/settings', icon: 'settings' },
];

const ADMIN_NAV = [
  { section: 'Operations' },
  { label: 'Overview', to: '/admin', icon: 'chart', exact: true },
  { label: 'Opportunities', to: '/admin/jobs', icon: 'briefcase' },
  { label: 'Application Review', to: '/admin/applications', icon: 'clipboard', badge: 'review' },
  { label: 'Contributors', to: '/admin/contributors', icon: 'users' },
  { label: 'Assessments', to: '/admin/assessments', icon: 'target' },
  { label: 'Project Tracking', to: '/admin/projects', icon: 'folder' },
  { label: 'Announcements', to: '/admin/announcements', icon: 'megaphone' },
];

function useBadges(user) {
  const apps = useStore((s) => s.applications);
  const notes = useStore((s) => s.notifications);
  if (!user) return {};
  return {
    assessments: apps.filter((a) => a.userId === user.id && a.status === 'assessment_required').length,
    notifications: notes.filter((n) => (n.userId === user.id || n.userId === '*') && !n.read).length,
    review: apps.filter((a) => a.status === 'submitted' || a.status === 'under_review').length,
  };
}

function isActive(item, path) {
  return item.exact ? path === item.to : path === item.to || path.startsWith(item.to + '/');
}

function Sidebar({ admin, onNavigate }) {
  const { path } = useLocation();
  const user = useSession();
  const badges = useBadges(user);
  const completion = profileCompletion(user);
  const nav = admin ? ADMIN_NAV : CONTRIBUTOR_NAV;
  return (
    <aside className="sidebar" aria-label={admin ? t('Admin navigation') : t('Dashboard navigation')}>
      <Link to={admin ? '/admin' : '/app'} onClick={onNavigate} aria-label={t('VERALINK dashboard home')}>
        <Logo light size={30} suffix={admin && <span className="admin-tag">{t('ADMIN')}</span>} />
      </Link>
      <nav>
        <ul className="side-nav">
          {nav.map((item) =>
            item.section ? (
              <li key={item.section} className="side-section" role="presentation">
                {t(item.section)}
              </li>
            ) : (
              <li key={item.to}>
                <Link to={item.to} className="side-link" aria-current={isActive(item, path) ? 'page' : undefined} onClick={onNavigate}>
                  <Icon name={item.icon} />
                  {t(item.label)}
                  {item.badge && badges[item.badge] > 0 && (
                    <span className="pill" aria-label={t('{n} pending', { n: badges[item.badge] })}>
                      {badges[item.badge]}
                    </span>
                  )}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
      <div className="sidebar-foot">
        {admin ? (
          <div className="side-card">
            <strong>{t('Admin console')}</strong>
            {t('Separate permissions from the contributor area. Manage opportunities, reviews and announcements here.')}
          </div>
        ) : (
          completion < 100 && (
            <div className="side-card">
              <strong>{t('Profile {n}% complete', { n: completion })}</strong>
              <Progress value={completion} label={t('Profile completion')} />
              <Link to="/app/profile" onClick={onNavigate}>
                {t('Complete profile →')}
              </Link>
            </div>
          )
        )}
      </div>
    </aside>
  );
}

function UserMenu({ admin }) {
  const user = useSession();
  const toast = useToast();
  const signOut = useSignOut();
  const name = user?.profile?.fullName || user?.email;
  const logout = async () => {
    await signOut();
    toast(t('You have been logged out'), { icon: 'logout' });
  };
  return (
    <Dropdown
      label={t('Account')}
      trigger={(p) => (
        <button type="button" className="user-btn" {...p} aria-label={t('Account menu')}>
          <span className="avatar">{initials(user?.profile?.fullName || user?.email)}</span>
          <span>{name?.split(' ')[0]}</span>
          <Icon name="chevronDown" />
        </button>
      )}
    >
      <div className="menu-label">{user?.email}</div>
      {!admin && (
        <>
          <button type="button" role="menuitem" className="menu-item" onClick={() => navigate('/app/profile')}>
            <Icon name="user" /> {t('My profile')}
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => navigate('/app/settings')}>
            <Icon name="settings" /> {t('Settings')}
          </button>
        </>
      )}
      <button type="button" role="menuitem" className="menu-item" onClick={() => navigate('/')}>
        <Icon name="globe" /> {t('Public website')}
      </button>
      <div className="menu-sep" />
      <button type="button" role="menuitem" className="menu-item" onClick={logout}>
        <Icon name="logout" /> {t('Log out')}
      </button>
    </Dropdown>
  );
}

export default function AppShell({ admin = false, crumb, children }) {
  const [open, setOpen] = useState(false);
  const user = useSession();
  const badges = useBadges(user);
  return (
    <>
      <div className={`app-shell ${admin ? 'admin' : ''}`}>
        <Sidebar admin={admin} />
        <div className="app-main">
          <header className="topbar">
            <IconButton icon="menu" label={t('Open navigation')} className="sidebar-toggle" onClick={() => setOpen(true)} />
            <span className="mobile-logo">
              <Logo size={28} wordmark={false} />
            </span>
            <div className="crumb">
              {admin ? t('Admin') : t('Dashboard')} / <strong>{t(crumb)}</strong>
            </div>
            <div className="topbar-actions">
              <Preferences />
              {!admin && (
                <Link
                  to="/app/notifications"
                  className="btn btn-ghost btn-icon notif-btn"
                  aria-label={badges.notifications ? t('Notifications, {n} unread', { n: badges.notifications }) : t('Notifications')}
                >
                  <Icon name="bell" />
                  {badges.notifications > 0 && <span className="dot" />}
                </Link>
              )}
              <UserMenu admin={admin} />
            </div>
          </header>
          <main className="app-content" id="main">
            <div className="app-content-inner">{children}</div>
          </main>
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} label={t('Navigation')} side="start">
        <Sidebar admin={admin} onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

export function PageHead({ title, description, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
