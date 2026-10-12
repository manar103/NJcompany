// API facade. Every screen talks to the "backend" through these async functions only,
// so swapping the local store for real HTTP calls (e.g. a Django REST Framework service)
// means re-implementing this file — components stay unchanged.
//
// Authentication is real (Clerk). Applications, assessments, submissions and admin actions
// still run against the local store until a backend is connected.
import { store, uid, today } from './store';
import { STATUS_META, categoryById } from '../data/constants';
import { t } from '../i18n';

const LATENCY = 450;
const wait = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

async function read(fn) {
  await wait();
  return fn(store.view());
}

async function write(fn, ms) {
  await wait(ms);
  let result;
  store.set((s) => {
    const out = fn(s);
    result = out.result;
    return out.state;
  });
  return result;
}

const notify = (s, userId, n) => [{ id: uid('n'), userId, read: false, at: new Date().toISOString(), ...n }, ...s.notifications];

/* ---------------- Auth ---------------- */
// Sign-up, sign-in, verification and passwords are handled by Clerk (see lib/auth.jsx).
// These helpers only mirror the Clerk session into the local store.
export const auth = {
  currentUser() {
    const s = store.get();
    return s.users.find((u) => u.id === s.sessionUserId) || null;
  },
  /** Create or update the local record for a signed-in Clerk user and make it the session. */
  syncExternalUser({ id, email, name, role }) {
    store.set((s) => {
      const existing = s.users.find((u) => u.id === id);
      const base = existing || { id, createdAt: today(), onboarded: false, profile: { fullName: name, languages: [], skills: [], interests: [] } };
      const user = {
        ...base,
        email,
        role,
        emailVerified: true,
        onboarded: base.onboarded || role === 'admin',
        profile: { ...base.profile, fullName: base.profile.fullName || name },
      };
      const users = existing ? s.users.map((u) => (u.id === id ? user : u)) : [...s.users, user];
      return { ...s, users, sessionUserId: id };
    });
  },
  clearSession() {
    if (store.get().sessionUserId !== null) store.set((s) => ({ ...s, sessionUserId: null }));
  },
};

/* ---------------- Profile ---------------- */
export const profile = {
  async update(patch, extra = {}) {
    return write((s) => {
      const users = s.users.map((u) => (u.id === s.sessionUserId ? { ...u, ...extra, profile: { ...u.profile, ...patch } } : u));
      return { state: { ...s, users }, result: users.find((u) => u.id === s.sessionUserId) };
    }, 400);
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
  async save(job) {
    return write((s) => {
      const exists = s.jobs.some((j) => j.id === job.id);
      const next = exists ? s.jobs.map((j) => (j.id === job.id ? { ...j, ...job } : j)) : [{ ...job, id: `vl-${Math.floor(200 + Math.random() * 700)}`, postedAt: today() }, ...s.jobs];
      return { state: { ...s, jobs: next }, result: true };
    });
  },
};

/* ---------------- Applications ---------------- */
const withHistory = (a, status, note) => ({ ...a, status, updatedAt: today(), history: [...a.history, { status, at: today(), note }] });

export const applications = {
  mine: () => read((s) => s.applications.filter((a) => a.userId === s.sessionUserId)),
  get: (id) =>
    read((s) => {
      const a = s.applications.find((x) => x.id === id);
      if (!a) throw new ApiError(t('Application not found.'));
      return a;
    }),
  async submit(jobId, answers, { draft = false } = {}) {
    return write((s) => {
      const job = s.jobs.find((j) => j.id === jobId);
      const existing = s.applications.find((a) => a.jobId === jobId && a.userId === s.sessionUserId && a.status !== 'withdrawn');
      if (existing && existing.status !== 'draft') throw new ApiError(t('You have already applied to this opportunity.'));
      const needsAssessment = job.assessment?.required;
      let app = existing || { id: uid('ap'), jobId, userId: s.sessionUserId, createdAt: today(), history: [], assessment: needsAssessment ? { status: 'not_started' } : null };
      app = { ...app, answers };
      if (draft) app = existing ? { ...app, updatedAt: today() } : withHistory(app, 'draft');
      else {
        app = withHistory(app, 'submitted');
        if (needsAssessment) app = withHistory(app, 'assessment_required', t('Complete the {name}', { name: job.assessment.name }));
      }
      const others = s.applications.filter((a) => a.id !== app.id);
      const notifications = draft
        ? s.notifications
        : notify(s, s.sessionUserId, { type: 'status', title: t('Application submitted'), body: t('Your application for “{title}” was submitted.', { title: t(job.title) }), link: `/app/applications/${app.id}` });
      return { state: { ...s, applications: [app, ...others], notifications }, result: app };
    }, 700);
  },
  async withdraw(id) {
    return write((s) => ({ state: { ...s, applications: s.applications.map((a) => (a.id === id ? withHistory(a, 'withdrawn', t('Withdrawn by you')) : a)) }, result: true }));
  },
  async discardDraft(id) {
    return write((s) => ({ state: { ...s, applications: s.applications.filter((a) => a.id !== id) }, result: true }));
  },
};

/* ---------------- Assessments ---------------- */
export const assessments = {
  saveProgress(appId, data) {
    store.set((s) => ({ ...s, drafts: { ...s.drafts, [`assess:${appId}`]: { ...data, savedAt: new Date().toISOString() } } }));
  },
  loadProgress: (appId) => store.get().drafts[`assess:${appId}`] || null,
  async submit(appId) {
    return write((s) => {
      const applicationsNext = s.applications.map((a) =>
        a.id === appId ? withHistory({ ...a, assessment: { status: 'completed', completedAt: today() } }, 'under_review', t('Assessment completed')) : a
      );
      return { state: { ...s, applications: applicationsNext }, result: true };
    }, 900);
  },
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
  async start(id) {
    return write((s) => ({ state: { ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'active', startedAt: today(), agreedAt: today() } : p)) }, result: true }));
  },
  saveDraft(key, data) {
    store.set((s) => ({ ...s, drafts: { ...s.drafts, [`work:${key}`]: { ...data, savedAt: new Date().toISOString() } } }));
  },
  loadDraft: (key) => store.get().drafts[`work:${key}`] || null,
  /** Marks a task done locally. In production this would POST the task output for review. */
  async completeTask(projectId, key) {
    return write((s) => {
      const drafts = { ...s.drafts };
      delete drafts[`work:${key}`];
      const projectsNext = s.projects.map((p) => (p.id === projectId ? { ...p, status: 'active', startedAt: p.startedAt || today(), done: Math.min(p.total, p.done + 1) } : p));
      return { state: { ...s, drafts, projects: projectsNext }, result: true };
    }, 700);
  },
};

/* ---------------- Notifications ---------------- */
export const notifications = {
  mine: () => read((s) => s.notifications.filter((n) => n.userId === s.sessionUserId || n.userId === '*').sort((a, b) => b.at.localeCompare(a.at))),
  markRead(id) {
    store.set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },
  markAll() {
    store.set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.userId === s.sessionUserId || n.userId === '*' ? { ...n, read: true } : n)) }));
  },
};

/* ---------------- Admin (simulated) ---------------- */
export const admin = {
  allApplications: () => read((s) => s.applications),
  async decide(appId, status, note) {
    return write((s) => {
      const app = s.applications.find((a) => a.id === appId);
      const job = s.jobs.find((j) => j.id === app.jobId);
      let projectsNext = s.projects;
      if (status === 'accepted' && !s.projects.some((p) => p.applicationId === appId)) {
        projectsNext = [...s.projects, { id: uid('pr'), applicationId: appId, jobId: app.jobId, userId: app.userId, status: 'not_started', done: 0, total: 20, startedAt: null, dueAt: job.deadline }];
      }
      return {
        state: {
          ...s,
          projects: projectsNext,
          applications: s.applications.map((a) => (a.id === appId ? withHistory(a, status, note) : a)),
          notifications: notify(s, app.userId, { type: 'status', title: t('Application {status}', { status: t(STATUS_META[status].label).toLowerCase() }), body: `“${t(job.title)}”: ${note || t(STATUS_META[status].label)}`, link: `/app/applications/${appId}` }),
        },
        result: true,
      };
    });
  },
  async announce({ title, body }) {
    return write((s) => ({
      state: { ...s, announcements: [{ id: uid('an'), title, body, at: new Date().toISOString() }, ...s.announcements], notifications: notify(s, '*', { type: 'announcement', title, body, link: '/app/opportunities' }) },
      result: true,
    }));
  },
};
