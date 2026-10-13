// API facade. Screens talk to the backend only through these functions.
//
// Data lives in Neon Postgres behind the /api functions (api/router.js). The local store is a
// cache of what the server returned from GET /api/state: reads come from that cache, and every
// write calls the server and then refreshes it. Only per-device drafts and preferences stay
// in this browser.
import { store } from './store';
import { categoryById } from '../data/constants';
import { t } from '../i18n';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/* ---------------- HTTP ---------------- */
let getToken = async () => null;
/** lib/auth.jsx registers Clerk's getToken here so requests carry the session. */
export function setTokenGetter(fn) {
  getToken = fn || (async () => null);
}

async function http(method, path, body) {
  const token = await getToken();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(t('Could not reach the server. Check your connection and try again.'), 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(t(data.error || 'Something went wrong'), res.status);
  return data;
}

/* ---------------- State cache ---------------- */
let loading = null;
/** Fetch everything the current user may see and replace the cached copy. */
export function loadState() {
  loading ??= http('GET', '/state')
    .then((s) => {
      store.set((prev) => ({ ...prev, ...s, users: s.users, sessionUserId: s.me?.id ?? null, loaded: true, loadError: null }));
    })
    .catch((err) => {
      store.set((prev) => ({ ...prev, loaded: true, loadError: err.message }));
      throw err;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Run a server write, then refresh the cache so every screen sees the result. */
async function mutate(method, path, body) {
  const result = await http(method, path, body);
  await loadState();
  return result;
}

async function read(fn) {
  if (!store.get().loaded) await loadState().catch(() => {});
  const s = store.view();
  if (s.loadError) throw new ApiError(s.loadError);
  return fn(s);
}

/* ---------------- Auth ---------------- */
// Sign-up, sign-in, verification and passwords are handled by Clerk (see lib/auth.jsx).
export const auth = {
  currentUser() {
    const s = store.get();
    return s.users.find((u) => u.id === s.sessionUserId) || null;
  },
  /** After Clerk sign-in: create/refresh the user on the server (role is decided there). */
  async sync() {
    await http('POST', '/me/sync');
    await loadState();
  },
  /** After sign-out: drop the private data and reload what visitors can see. */
  async clearSession() {
    store.set((s) => ({ ...s, sessionUserId: null, users: [], applications: [], projects: [], notifications: [], announcements: [], loaded: false }));
    await loadState().catch(() => {});
  },
};

/* ---------------- Profile ---------------- */
export const profile = {
  async update(patch, extra = {}) {
    await mutate('PATCH', '/me', { profile: patch, onboarded: extra.onboarded === true });
    return auth.currentUser();
  },
};

export function profileCompletion(user) {
  const p = user?.profile || {};
  const checks = [p.fullName, p.country, p.preferredLanguage, p.languages?.length, p.skills?.length, p.interests?.length, p.experienceSummary, p.availability, p.resumeName || p.portfolioUrl];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/* ---------------- Jobs ---------------- */
export function filterJobs(jobs, f = {}) {
  const q = (f.q || '').trim().toLowerCase();
  let out = jobs.filter((j) => j.status === 'open');
  if (q) out = out.filter((j) => [j.title, j.summary, categoryById[j.category]?.name, ...j.languages.map((l) => l.name)].join(' ').toLowerCase().includes(q));
  if (f.categories?.length) out = out.filter((j) => f.categories.includes(j.category));
  if (f.languages?.length) out = out.filter((j) => j.languages.some((l) => f.languages.includes(l.name)));
  if (f.regions?.length) out = out.filter((j) => j.regions.includes('Global') || j.regions.some((r) => f.regions.includes(r)));
  if (f.experience?.length) out = out.filter((j) => f.experience.includes(j.experience));
  if (f.workTypes?.length) out = out.filter((j) => f.workTypes.includes(j.workType));
  if (f.compensation?.length) out = out.filter((j) => f.compensation.includes(j.compensation.type));
  const score = (j) => (q && j.title.toLowerCase().includes(q) ? 3 : 0) + (j.featured ? 1 : 0);
  out = [...out].sort((a, b) => (f.sort === 'relevance' ? score(b) - score(a) || b.postedAt.localeCompare(a.postedAt) : b.postedAt.localeCompare(a.postedAt)));
  return out;
}

export const jobs = {
  list: (filters) => read((s) => filterJobs(s.jobs, filters)),
  all: () => read((s) => s.jobs),
  get: (id) =>
    read((s) => {
      const job = s.jobs.find((j) => j.id === id);
      if (!job) throw new ApiError(t('This opportunity could not be found. It may have been closed or removed.'));
      return job;
    }),
  save: (job) => mutate('POST', '/jobs', { job }),
};

/* ---------------- Applications ---------------- */
export const applications = {
  mine: () => read((s) => s.applications.filter((a) => a.userId === s.sessionUserId)),
  get: (id) =>
    read((s) => {
      const a = s.applications.find((x) => x.id === id);
      if (!a) throw new ApiError(t('Application not found.'));
      return a;
    }),
  async submit(jobId, answers, { draft = false } = {}) {
    const { id } = await mutate('POST', '/applications', { jobId, answers, draft });
    return store.get().applications.find((a) => a.id === id);
  },
  withdraw: (id) => mutate('POST', `/applications/${id}/withdraw`),
  discardDraft: (id) => mutate('DELETE', `/applications/${id}`),
};

/* ---------------- Assessments ---------------- */
export const assessments = {
  // Answers in progress are kept on this device until the assessment is submitted.
  saveProgress(appId, data) {
    store.set((s) => ({ ...s, drafts: { ...s.drafts, [`assess:${appId}`]: { ...data, savedAt: new Date().toISOString() } } }));
  },
  loadProgress: (appId) => store.get().drafts[`assess:${appId}`] || null,
  submit: (appId) => mutate('POST', `/applications/${appId}/assessment`),
};

/* ---------------- Projects & workspace ---------------- */
export const projects = {
  mine: () => read((s) => s.projects.filter((p) => p.userId === s.sessionUserId)),
  get: (id) =>
    read((s) => {
      const p = s.projects.find((x) => x.id === id && x.userId === s.sessionUserId);
      if (!p) throw new ApiError(t('Project not found or you do not have access to it.'));
      return p;
    }),
  /** Records agreement acknowledgement and opens the workspace. */
  start: (id) => mutate('POST', `/projects/${id}/start`),
  saveDraft(key, data) {
    store.set((s) => ({ ...s, drafts: { ...s.drafts, [`work:${key}`]: { ...data, savedAt: new Date().toISOString() } } }));
  },
  loadDraft: (key) => store.get().drafts[`work:${key}`] || null,
  async completeTask(projectId, key) {
    await mutate('POST', `/projects/${projectId}/complete-task`);
    store.set((s) => {
      const drafts = { ...s.drafts };
      delete drafts[`work:${key}`];
      return { ...s, drafts };
    });
  },
};

/* ---------------- Notifications ---------------- */
/** Notification text in the current language (server stores English templates + vars). */
export function noteText(n) {
  const vars = Object.fromEntries(Object.entries(n.vars || {}).map(([k, v]) => [k, typeof v === 'string' ? t(v) : v]));
  return { title: t(n.title, vars), body: t(n.body, vars) };
}

const markLocal = (pred) => store.set((s) => ({ ...s, notifications: s.notifications.map((n) => (pred(n) ? { ...n, read: true } : n)) }));

export const notifications = {
  mine: () => read((s) => [...s.notifications].sort((a, b) => b.at.localeCompare(a.at))),
  markRead(id) {
    markLocal((n) => n.id === id);
    http('POST', `/notifications/${id}/read`).catch(() => {});
  },
  markAll() {
    markLocal(() => true);
    http('POST', '/notifications/read-all').catch(() => {});
  },
};

/* ---------------- Admin ---------------- */
export const admin = {
  allApplications: () => read((s) => s.applications),
  decide: (appId, status, note) => mutate('POST', `/admin/applications/${appId}/decision`, { status, note }),
  announce: ({ title, body }) => mutate('POST', '/announcements', { title, body }),
};
