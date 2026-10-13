// Local store. Everything here lives in this browser's localStorage for now —
// it stands in for the database and is replaced by real API calls once the backend exists.
// The platform starts empty: admins create opportunities, contributors sign up through Clerk.
import { localizeJob } from '../data/localize';
import { getLang } from '../i18n';

const KEY = 'veralink.data.v3';

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
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const { credentials, dev, ...saved } = JSON.parse(raw); // eslint-disable-line no-unused-vars -- dropped legacy keys
      return { ...initial(), ...saved };
    }
  } catch {
    /* storage unavailable — fall back to in-memory */
  }
  return initial();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
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

export const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
export const today = () => new Date().toISOString().slice(0, 10);
