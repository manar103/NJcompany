// Clerk integration. Clerk owns sign-up, sign-in, email verification, password reset and
// sessions; this bridge mirrors the signed-in Clerk user into the local app store so every
// screen keeps using `useSession()` unchanged.
//
// Admin access: a user is an admin when their Clerk *public metadata* contains
// { "role": "admin" }, or their email is listed in VITE_ADMIN_EMAILS (comma separated).
import { createContext, useContext, useLayoutEffect } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { auth } from '../services/api';
import { navigate } from './router';
import { useStore } from './hooks';

export const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const CLERK_ENABLED = Boolean(CLERK_KEY);

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ReadyContext = createContext(true);

/** False while Clerk is loading or the local session has not caught up with Clerk yet. */
export const useAuthReady = () => useContext(ReadyContext);

function toAccount(user) {
  const email = (user.primaryEmailAddress?.emailAddress || '').toLowerCase();
  const isAdmin = user.publicMetadata?.role === 'admin' || ADMIN_EMAILS.includes(email);
  return { id: user.id, email, name: user.fullName || '', role: isAdmin ? 'admin' : 'contributor' };
}

export function ClerkBridge({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const sessionUserId = useStore((s) => s.sessionUserId);
  const account = isSignedIn && user ? toAccount(user) : null;
  const localRole = useStore((s) => s.users.find((u) => u.id === s.sessionUserId)?.role);
  const ready = isLoaded && (account ? sessionUserId === account.id && localRole === account.role : sessionUserId == null);

  useLayoutEffect(() => {
    if (!isLoaded) return;
    if (account) auth.syncExternalUser(account);
    else auth.clearSession();
  }, [isLoaded, account?.id, account?.email, account?.name, account?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  return <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>;
}

/** Sign out of Clerk and clear the local session. */
export function useSignOut() {
  const clerk = CLERK_ENABLED ? useClerk() : null; // eslint-disable-line react-hooks/rules-of-hooks -- constant per build
  return async () => {
    if (clerk) await clerk.signOut({ redirectUrl: '/' });
    auth.clearSession();
    navigate('/');
  };
}

/** Opens Clerk's account panel (email, password, connected accounts, sessions). */
export function useOpenAccountSecurity() {
  const clerk = CLERK_ENABLED ? useClerk() : null; // eslint-disable-line react-hooks/rules-of-hooks -- constant per build
  return clerk ? () => clerk.openUserProfile() : null;
}
