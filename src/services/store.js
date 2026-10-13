// Client-side store: a cache of the server data (filled by api.loadState) plus per-device
// drafts and preferences. Only `drafts` and `prefs` are saved in this browser.
import { localizeJob } from '../data/localize';
import { getLang } from '../i18n';

const KEY = 'veralink.device.v1';
const SAVED = ['drafts', 'prefs'];

const initial = () => ({
  users: [],
  sessionUserId: null,
  jobs: [],
  applications: [],
  projects: [],
  notifications: [],
  drafts: {}, // assessment + workspace save-and-continue data, keyed by id
  announcements: [],
  prefs: {},
  loaded: false, // true once GET /api/state has answered
  loadError: null,
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...initial(), ...Object.fromEntries(SAVED.map((k) => [k, saved[k] ?? initial()[k]])) };
    }
  } catch {
    /* storage unavailable — fall back to in-memory */
  }
  return initial();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(SAVED.map((k) => [k, state[k]]))));
  } catch {
    /* ignore quota / private mode */
  }
}

// Cached display-language view (job text translated); recomputed when state or language changes.
let view = { state: null, lang: null, value: null };

export const store = {
  get: () => state,
  /** State as it should be displayed. Writes always go through `set` on the raw state. */
  view() {
    const lang = getLang();
    if (view.state !== state || view.lang !== lang) view = { state, lang, value: { ...state, jobs: state.jobs.map(localizeJob) } };
    return view.value;
  },
  set(updater) {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    persist();
    listeners.forEach((l) => l());
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    state = initial();
    persist();
    listeners.forEach((l) => l());
  },
};

