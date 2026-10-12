// Light / dark / system theme. The choice is saved per browser and applied as
// <html data-theme="light|dark">; index.html applies it before first paint to avoid a flash.
import { useSyncExternalStore } from 'react';

const KEY = 'veralink.theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set();

function readChoice() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

let choice = readChoice();
const resolve = () => (choice === 'system' ? (media.matches ? 'dark' : 'light') : choice);
let resolved = resolve();

function apply() {
  resolved = resolve();
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0f1520' : '#1B263B');
  listeners.forEach((l) => l());
}
apply();
media.addEventListener('change', () => choice === 'system' && apply());

export function setTheme(next) {
  choice = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  apply();
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Returns { choice: 'light'|'dark'|'system', theme: 'light'|'dark' }. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => resolved);
  const current = useSyncExternalStore(subscribe, () => choice);
  return { choice: current, theme };
}
