// Clerk integration. Clerk owns sign-up, sign-in, email verification, password reset and
// sessions. This bridge hands Clerk's session token to the API client, registers the user
// on the server after sign-in, and loads the data that user may see.
//
// Roles are decided by the server (api/_lib/auth.js): a user is an admin when their Clerk
// public metadata contains { "role": "admin" } or their email is in ADMIN_EMAILS /
// VITE_ADMIN_EMAILS.
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { auth, loadState, setTokenGetter } from '../services/api';
import { navigate } from './router';
import { useStore } from './hooks';

export const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const CLERK_ENABLED = Boolean(CLERK_KEY);

const ReadyContext = createContext(true);

/** False until Clerk has loaded and the server data for the current user is in the store. */
export const useAuthReady = () => useContext(ReadyContext);

export function ClerkBridge({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const sessionUserId = useStore((s) => s.sessionUserId);
  const loaded = useStore((s) => s.loaded);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setTokenGetter(isSignedIn ? () => getToken() : null);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    setFailed(false);
    const run = isSignedIn ? auth.sync() : auth.clearSession();
    run.catch(() => setFailed(true));
  }, [isLoaded, isSignedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick up changes made by others (new listings, decisions) when the tab regains focus.
  useEffect(() => {
    const onFocus = () => loadState().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const ready = isLoaded && (failed || (loaded && (isSignedIn ? sessionUserId === user?.id : sessionUserId == null)));
  return <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>;
}

/** Sign out of Clerk and clear the signed-in data. */
export function useSignOut() {
  const clerk = CLERK_ENABLED ? useClerk() : null; // eslint-disable-line react-hooks/rules-of-hooks -- constant per build
  return async () => {
    if (clerk) await clerk.signOut({ redirectUrl: '/' });
    await auth.clearSession();
    navigate('/');
  };
}

/** Opens Clerk's account panel (email, password, connected accounts, sessions). */
export function useOpenAccountSecurity() {
  const clerk = CLERK_ENABLED ? useClerk() : null; // eslint-disable-line react-hooks/rules-of-hooks -- constant per build
  return clerk ? () => clerk.openUserProfile() : null;
}
