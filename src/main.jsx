import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { arSA } from '@clerk/localizations';
import { dark } from '@clerk/ui/themes';
import { RouterProvider, navigate } from './lib/router';
import { ClerkBridge, CLERK_ENABLED, CLERK_KEY } from './lib/auth';
import { useLang } from './i18n';
import { useTheme } from './lib/theme';
import { ToastProvider } from './components/ui';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';

function Root() {
  const lang = useLang();
  const { theme } = useTheme();
  // Remount the app on language change so every t() call re-runs.
  const app = (
    <ToastProvider key={lang}>
      <App />
    </ToastProvider>
  );
  if (!CLERK_ENABLED) return <RouterProvider>{app}</RouterProvider>;
  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      localization={lang === 'ar' ? arSA : undefined}
      appearance={{
        theme: theme === 'dark' ? dark : undefined,
        variables: { colorPrimary: theme === 'dark' ? '#dbe3ee' : '#1b263b', borderRadius: '10px', fontFamily: 'var(--font)' },
        elements: { rootBox: { width: '100%' }, cardBox: { width: '100%', boxShadow: 'none' } },
      }}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      signUpUrl="/signup"
      afterSignOutUrl="/"
    >
      <RouterProvider>
        <ClerkBridge>{app}</ClerkBridge>
      </RouterProvider>
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
