// Tiny i18n layer. English strings are the keys; `ar.js` maps them to Arabic.
// Missing translations fall back to English, so untranslated text never disappears.
import { Fragment, createElement, useSyncExternalStore } from 'react';
import ar from './ar';

const KEY = 'veralink.lang';
export const LANGS = [
  { id: 'en', label: 'English', dir: 'ltr' },
  { id: 'ar', label: 'العربية', dir: 'rtl' },
];

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

let lang = initial();
const listeners = new Set();

function apply() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
apply();

export const getLang = () => lang;
export const isRTL = () => lang === 'ar';

export function setLang(next) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  apply();
  listeners.forEach((l) => l());
}

export function useLang() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => lang
  );
}

/** Translate an English UI string. `{name}` placeholders are filled from `vars`. */
export function t(str, vars) {
  if (str == null) return str;
  let out = lang === 'ar' ? (ar[str] ?? str) : str;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  return out;
}

/** Pick the plural form: tn(n, '{n} result', '{n} results'). Arabic has its own forms in ar.js. */
export function tn(n, one, other) {
  return t(n === 1 ? one : other, { n });
}

/** BCP-47 locale for Intl formatting (Latin digits in both languages). */
export const locale = () => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB');

/** Like t(), but placeholders may be React nodes: tx('Apply by {date}', { date: <strong>…</strong> }). */
export function tx(str, vars = {}) {
  return t(str)
    .split(/(\{\w+\})/)
    .map((part, i) => {
      const m = part.match(/^\{(\w+)\}$/);
      return createElement(Fragment, { key: i }, m && vars[m[1]] !== undefined ? vars[m[1]] : part);
    });
}

/** Turn the listed string fields of each item into getters that translate on access. */
export function translated(items, ...fields) {
  for (const item of Array.isArray(items) ? items : Object.values(items)) {
    for (const f of fields) {
      const en = item[f];
      if (typeof en === 'string') Object.defineProperty(item, f, { get: () => t(en), enumerable: true, configurable: true });
    }
  }
  return items;
}
