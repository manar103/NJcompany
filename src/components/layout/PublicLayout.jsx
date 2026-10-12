import { useState } from 'react';
import { Link, navigate } from '../../lib/router';
import { useSession } from '../../lib/hooks';
import { t } from '../../i18n';
import { Button, Drawer, IconButton, Logo, Icon } from '../ui';
import Preferences from './Preferences';

const NAV = [
  { label: 'Find Opportunities', to: '/opportunities' },
  { label: 'How It Works', to: '/?s=how-it-works' },
  { label: 'Job Categories', to: '/?s=categories' },
  { label: 'FAQ', to: '/?s=faq' },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const user = useSession();
  const home = user ? (user.role === 'admin' ? '/admin' : '/app') : null;
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" aria-label={t('VERALINK home')}>
          <Logo />
        </Link>
        <nav className="site-nav" aria-label={t('Main')}>
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} data-nav={n.to.startsWith('/opportunities') || undefined}>
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="site-actions">
          <Preferences className="hide-sm" />
          {home ? (
            <Button to={home} size="sm" iconRight="arrowRight" className="hide-md">
              {t('Go to dashboard')}
            </Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm" className="hide-md">
                {t('Log In')}
              </Button>
              <Button to="/signup" size="sm" className="hide-md">
                {t('Get Started')}
              </Button>
            </>
          )}
          <IconButton icon="menu" label={t('Open menu')} className="menu-toggle" onClick={() => setOpen(true)} />
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} label={t('Menu')} side="end">
        <div className="drawer-head">
          <Logo size={28} />
          <IconButton icon="x" label={t('Close menu')} onClick={() => setOpen(false)} />
        </div>
        <nav className="mobile-nav" aria-label={t('Mobile')}>
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} onClick={() => setOpen(false)}>
              {t(n.label)}
            </Link>
          ))}
          <Preferences className="drawer-prefs" />
          <div className="stack-sm" style={{ marginTop: 16 }}>
            {home ? (
              <Button block onClick={() => { setOpen(false); navigate(home); }}>
                {t('Go to dashboard')}
              </Button>
            ) : (
              <>
                <Button block onClick={() => { setOpen(false); navigate('/signup'); }}>
                  {t('Get Started')}
                </Button>
                <Button block variant="secondary" onClick={() => { setOpen(false); navigate('/login'); }}>
                  {t('Log In')}
                </Button>
              </>
            )}
          </div>
        </nav>
      </Drawer>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo light />
            <p style={{ marginTop: 16, maxWidth: 320 }}>{t('Connect Talent. Power AI. A global platform for people who help build better AI systems.')}</p>
            <div className="socials" aria-label={t('Social channels')}>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label={t('LinkedIn (opens in new tab)')}>
                <Icon name="linkedin" />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label={t('X (opens in new tab)')}>
                <Icon name="xsocial" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label={t('GitHub (opens in new tab)')}>
                <Icon name="github" />
              </a>
            </div>
          </div>
          <div>
            <h3>{t('Platform')}</h3>
            <ul>
              <li><Link to="/opportunities">{t('Find Opportunities')}</Link></li>
              <li><Link to="/?s=how-it-works">{t('How It Works')}</Link></li>
              <li><Link to="/?s=categories">{t('Job Categories')}</Link></li>
              <li><Link to="/signup">{t('Create an account')}</Link></li>
            </ul>
          </div>
          <div>
            <h3>{t('Company')}</h3>
            <ul>
              <li><Link to="/page/about">{t('About')}</Link></li>
              <li><Link to="/page/contact">{t('Contact')}</Link></li>
              <li><Link to="/page/help">{t('Help Center')}</Link></li>
              <li><Link to="/brand">{t('Brand & Design')}</Link></li>
            </ul>
          </div>
          <div>
            <h3>{t('Legal')}</h3>
            <ul>
              <li><Link to="/page/privacy">{t('Privacy Policy')}</Link></li>
              <li><Link to="/page/terms">{t('Terms of Service')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} VERALINK. {t('All rights reserved.')}</span>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  return (
    <>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('Skip to content')}
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
