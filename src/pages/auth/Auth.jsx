// Sign-in and sign-up are rendered by Clerk. Clerk also handles email verification,
// password reset, social logins and multi-factor auth, so those screens live inside
// these components (as sub-paths such as /login/factor-one).
import { SignIn, SignUp } from '@clerk/react';
import { Link, useLocation } from '../../lib/router';
import { useDocumentTitle } from '../../lib/hooks';
import { CLERK_ENABLED } from '../../lib/auth';
import { t } from '../../i18n';
import { Alert, Icon, Logo } from '../../components/ui';
import Preferences from '../../components/layout/Preferences';
import HeroVisual from '../../components/HeroVisual';

function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" aria-label={t('VERALINK home')}>
          <Logo light />
        </Link>
        <div className="art">
          <HeroVisual />
        </div>
        <h2>{t('Connect Talent. Power AI.')}</h2>
        <p>{t('Join contributors who help AI understand more languages, voices and perspectives.')}</p>
        <ul>
          <li><Icon name="checkCircle" /> {t('Free to join — no fees, ever')}</li>
          <li><Icon name="checkCircle" /> {t('Requirements and terms shown before you apply')}</li>
          <li><Icon name="checkCircle" /> {t('Track every application in one place')}</li>
        </ul>
      </aside>
      <main className="auth-main" id="main">
        <div className="top">
          <Link to="/" className="mobile-only" aria-label={t('VERALINK home')}>
            <Logo size={28} />
          </Link>
          <div className="row" style={{ marginInlineStart: 'auto', gap: 4 }}>
            <Preferences />
            <Link to="/" className="small link-btn">
              <Icon name="arrowLeft" /> {t('Back to website')}
            </Link>
          </div>
        </div>
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}

function NotConfigured() {
  return (
    <Alert tone="warning" title={t('Sign-in is not configured yet')}>
      {t('Add your Clerk publishable key as VITE_CLERK_PUBLISHABLE_KEY in the .env file, then restart the dev server.')}
    </Alert>
  );
}

/** Where Clerk should send people after they finish; /continue routes them by role. */
function useContinueUrl() {
  const { query } = useLocation();
  const next = query.get('next');
  return `/continue${next ? `?next=${encodeURIComponent(next)}` : ''}`;
}

export function Login() {
  useDocumentTitle(t('Log in'));
  const after = useContinueUrl();
  return (
    <AuthLayout>
      {CLERK_ENABLED ? (
        <SignIn routing="path" path="/login" signUpUrl="/signup" fallbackRedirectUrl={after} signUpFallbackRedirectUrl={after} />
      ) : (
        <NotConfigured />
      )}
    </AuthLayout>
  );
}

export function Signup() {
  useDocumentTitle(t('Create your account'));
  const after = useContinueUrl();
  return (
    <AuthLayout>
      {CLERK_ENABLED ? (
        <SignUp routing="path" path="/signup" signInUrl="/login" fallbackRedirectUrl={after} signInFallbackRedirectUrl={after} />
      ) : (
        <NotConfigured />
      )}
    </AuthLayout>
  );
}
