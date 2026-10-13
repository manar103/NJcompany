// VERALINK API — one Vercel Function that serves every /api/* route (see vercel.json).
// Every write checks the Clerk session on the server; admin routes also check the role.
import { sql, ensureSchema, uid, today } from './_lib/db.js';
import { HttpError, currentUser, requireAdmin, requireUser, syncUser } from './_lib/auth.js';
import { withJobDefaults } from '../src/data/jobDefaults.js';

const STATUS_LABEL = { under_review: 'Under Review', accepted: 'Accepted', rejected: 'Rejected' };

/* ---------------- Row → API shape (matches what the frontend already uses) ---------------- */
const day = (ts) => (ts instanceof Date ? ts.toISOString() : String(ts)).slice(0, 10);
const toUser = (u) => ({ id: u.id, email: u.email, role: u.role, emailVerified: true, onboarded: u.onboarded, createdAt: day(u.created_at), profile: u.profile });
const toJob = (j) => ({ ...j.data, id: j.id, status: j.status });
const toApp = (a) => ({ ...a.data, id: a.id, jobId: a.job_id, userId: a.user_id, status: a.status, createdAt: day(a.created_at), updatedAt: day(a.updated_at) });
const toProject = (p) => ({ ...p.data, id: p.id, applicationId: p.application_id, jobId: p.job_id, userId: p.user_id });
const toNote = (n, me) => ({ ...n.data, id: n.id, userId: n.user_id, at: new Date(n.created_at).toISOString(), read: n.user_id === '*' ? n.read_by.includes(me) : !!n.data.read });

const withHistory = (data, status, note) => ({ ...data, history: [...(data.history || []), { status, at: today(), note }] });

async function notify(userId, data) {
  await sql`insert into notifications (id, user_id, data) values (${uid('n')}, ${userId}, ${JSON.stringify(data)}::jsonb)`;
}

async function ownApplication(user, id) {
  const rows = await sql`select * from applications where id = ${id}`;
  const app = rows[0];
  if (!app || app.user_id !== user.id) throw new HttpError(404, 'Application not found.');
  return app;
}

async function ownProject(user, id) {
  const rows = await sql`select * from projects where id = ${id}`;
  const p = rows[0];
  if (!p || p.user_id !== user.id) throw new HttpError(404, 'Project not found or you do not have access to it.');
  return p;
}

/* ---------------- Routes ---------------- */
const routes = [
  // Everything the signed-in user (or a visitor) is allowed to see, in one request.
  ['GET', '/state', async (req) => {
    const me = await currentUser(req);
    const admin = me?.role === 'admin';
    const jobs = admin ? await sql`select * from jobs order by created_at desc` : await sql`select * from jobs where status = 'open' order by created_at desc`;
    if (!me) return { me: null, users: [], jobs: jobs.map(toJob), applications: [], projects: [], notifications: [], announcements: [] };
    const [users, apps, projects, notes, announcements] = await Promise.all([
      admin ? sql`select * from users order by created_at desc` : sql`select * from users where id = ${me.id}`,
      admin ? sql`select * from applications` : sql`select * from applications where user_id = ${me.id}`,
      admin ? sql`select * from projects` : sql`select * from projects where user_id = ${me.id}`,
      sql`select * from notifications where user_id = ${me.id} or user_id = '*' order by created_at desc limit 100`,
      admin ? sql`select * from announcements order by created_at desc` : [],
    ]);
    return {
      me: toUser(me),
      users: users.map(toUser),
      jobs: jobs.map(toJob),
      applications: apps.map(toApp),
      projects: projects.map(toProject),
      notifications: notes.map((n) => toNote(n, me.id)),
      announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, at: new Date(a.created_at).toISOString() })),
    };
  }],

  // Called right after sign-in: creates/refreshes the user row from Clerk.
  ['POST', '/me/sync', async (req) => ({ me: toUser(await syncUser(req)) })],

  ['PATCH', '/me', async (req, body) => {
    const me = await requireUser(req);
    const profile = { ...me.profile, ...(body.profile || {}) };
    const onboarded = me.onboarded || body.onboarded === true;
    await sql`update users set profile = ${JSON.stringify(profile)}::jsonb, onboarded = ${onboarded} where id = ${me.id}`;
    return { ok: true };
  }],

  // Admin: create or update an opportunity.
  ['POST', '/jobs', async (req, body) => {
    await requireAdmin(req);
    const input = body.job || {};
    if (input.id) {
      const rows = await sql`select * from jobs where id = ${input.id}`;
      if (!rows[0]) throw new HttpError(404, 'This opportunity could not be found. It may have been closed or removed.');
      const data = withJobDefaults({ ...rows[0].data, ...input });
      await sql`update jobs set data = ${JSON.stringify(data)}::jsonb, status = ${data.status}, updated_at = now() where id = ${input.id}`;
      return { id: input.id };
    }
    const id = uid('vl');
    const data = withJobDefaults({ ...input, id, postedAt: today() });
    await sql`insert into jobs (id, status, data) values (${id}, ${data.status}, ${JSON.stringify(data)}::jsonb)`;
    return { id };
  }],

  ['POST', '/applications', async (req, body) => {
    const me = await requireUser(req);
    if (me.role === 'admin') throw new HttpError(403, 'Admins cannot apply to opportunities.');
    const jobRows = await sql`select * from jobs where id = ${body.jobId} and status = 'open'`;
    const job = jobRows[0] && toJob(jobRows[0]);
    if (!job) throw new HttpError(404, 'This opportunity could not be found. It may have been closed or removed.');
    const existingRows = await sql`select * from applications where job_id = ${job.id} and user_id = ${me.id} and status <> 'withdrawn' limit 1`;
    const existing = existingRows[0];
    if (existing && existing.status !== 'draft') throw new HttpError(409, 'You have already applied to this opportunity.');

    const needsAssessment = !!job.assessment?.required;
    let data = existing ? existing.data : { history: [], assessment: needsAssessment ? { status: 'not_started' } : null };
    data = { ...data, answers: body.answers || {} };
    let status = 'draft';
    if (body.draft) {
      if (!existing) data = withHistory(data, 'draft');
    } else {
      data = withHistory(data, 'submitted');
      status = 'submitted';
      if (needsAssessment) {
        data = withHistory(data, 'assessment_required', `Complete the ${job.assessment.name}`);
        status = 'assessment_required';
      }
    }
    const id = existing?.id || uid('ap');
    if (existing) await sql`update applications set data = ${JSON.stringify(data)}::jsonb, status = ${status}, updated_at = now() where id = ${id}`;
    else await sql`insert into applications (id, job_id, user_id, status, data) values (${id}, ${job.id}, ${me.id}, ${status}, ${JSON.stringify(data)}::jsonb)`;
    if (!body.draft) {
      await notify(me.id, { type: 'status', title: 'Application submitted', body: 'Your application for “{title}” was submitted.', vars: { title: job.title }, link: `/app/applications/${id}` });
    }
    return { id, status };
  }],

  ['POST', '/applications/:id/withdraw', async (req, _body, { id }) => {
    const me = await requireUser(req);
    const app = await ownApplication(me, id);
    if (!['submitted', 'under_review', 'assessment_required'].includes(app.status)) throw new HttpError(409, 'This application can no longer be withdrawn.');
    const data = withHistory(app.data, 'withdrawn', 'Withdrawn by you');
    await sql`update applications set status = 'withdrawn', data = ${JSON.stringify(data)}::jsonb, updated_at = now() where id = ${id}`;
    return { ok: true };
  }],

  ['DELETE', '/applications/:id', async (req, _body, { id }) => {
    const me = await requireUser(req);
    const app = await ownApplication(me, id);
    if (app.status !== 'draft') throw new HttpError(409, 'Only drafts can be deleted.');
    await sql`delete from applications where id = ${id}`;
    return { ok: true };
  }],

  ['POST', '/applications/:id/assessment', async (req, _body, { id }) => {
    const me = await requireUser(req);
    const app = await ownApplication(me, id);
    if (app.status !== 'assessment_required') throw new HttpError(409, 'This assessment has already been submitted.');
    const data = withHistory({ ...app.data, assessment: { status: 'completed', completedAt: today() } }, 'under_review', 'Assessment completed');
    await sql`update applications set status = 'under_review', data = ${JSON.stringify(data)}::jsonb, updated_at = now() where id = ${id}`;
    return { ok: true };
  }],

  // Admin: move an application to review, or accept / reject it.
  ['POST', '/admin/applications/:id/decision', async (req, body, { id }) => {
    await requireAdmin(req);
    const { status } = body;
    if (!STATUS_LABEL[status]) throw new HttpError(400, 'Unknown decision.');
    const rows = await sql`select a.*, j.data as job_data from applications a join jobs j on j.id = a.job_id where a.id = ${id}`;
    const app = rows[0];
    if (!app) throw new HttpError(404, 'Application not found.');
    if (!['submitted', 'under_review'].includes(app.status)) throw new HttpError(409, 'A decision has already been recorded for this application.');
    if (status === 'accepted' && app.job_data.assessment?.required && app.data.assessment?.status !== 'completed') {
      throw new HttpError(409, 'The required assessment has not been completed. A decision can be recorded once it is.');
    }
    const note = (body.note || '').trim() || undefined;
    const data = withHistory(app.data, status, note);
    await sql`update applications set status = ${status}, data = ${JSON.stringify(data)}::jsonb, updated_at = now() where id = ${id}`;
    if (status === 'accepted') {
      const project = { status: 'not_started', done: 0, total: 20, startedAt: null, dueAt: app.job_data.deadline || null };
      await sql`insert into projects (id, application_id, job_id, user_id, data) values (${uid('pr')}, ${id}, ${app.job_id}, ${app.user_id}, ${JSON.stringify(project)}::jsonb) on conflict (application_id) do nothing`;
    }
    await notify(app.user_id, {
      type: 'status',
      title: 'Application {status}',
      body: '“{title}”: {note}',
      vars: { status: STATUS_LABEL[status], title: app.job_data.title, note: note || STATUS_LABEL[status] },
      link: `/app/applications/${id}`,
    });
    return { ok: true };
  }],

  ['POST', '/projects/:id/start', async (req, _body, { id }) => {
    const me = await requireUser(req);
    const p = await ownProject(me, id);
    const data = { ...p.data, status: 'active', startedAt: p.data.startedAt || today(), agreedAt: today() };
    await sql`update projects set data = ${JSON.stringify(data)}::jsonb where id = ${id}`;
    return { ok: true };
  }],

  ['POST', '/projects/:id/complete-task', async (req, _body, { id }) => {
    const me = await requireUser(req);
    const p = await ownProject(me, id);
    const done = Math.min(p.data.total, (p.data.done || 0) + 1);
    const data = { ...p.data, done, status: done >= p.data.total ? 'completed' : 'active', startedAt: p.data.startedAt || today() };
    await sql`update projects set data = ${JSON.stringify(data)}::jsonb where id = ${id}`;
    return { ok: true };
  }],

  ['POST', '/notifications/:id/read', async (req, _body, { id }) => {
    const me = await requireUser(req);
    await sql`update notifications set data = jsonb_set(data, '{read}', 'true') where id = ${id} and user_id = ${me.id}`;
    await sql`update notifications set read_by = array_append(read_by, ${me.id}) where id = ${id} and user_id = '*' and not (${me.id} = any(read_by))`;
    return { ok: true };
  }],

  ['POST', '/notifications/read-all', async (req) => {
    const me = await requireUser(req);
    await sql`update notifications set data = jsonb_set(data, '{read}', 'true') where user_id = ${me.id}`;
    await sql`update notifications set read_by = array_append(read_by, ${me.id}) where user_id = '*' and not (${me.id} = any(read_by))`;
    return { ok: true };
  }],

  // Admin: post an in-app announcement to every contributor.
  ['POST', '/announcements', async (req, body) => {
    const admin = await requireAdmin(req);
    const title = (body.title || '').trim();
    const text = (body.body || '').trim();
    if (title.length < 5) throw new HttpError(400, 'Title must be at least 5 characters.');
    if (text.length < 15) throw new HttpError(400, 'Message must be at least 15 characters.');
    await sql`insert into announcements (id, title, body, created_by) values (${uid('an')}, ${title}, ${text}, ${admin.id})`;
    await notify('*', { type: 'announcement', title, body: text, link: '/app/opportunities' });
    return { ok: true };
  }],
];

/* ---------------- Dispatch ---------------- */
function match(pattern, path) {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  // vercel.json rewrites /api/<path> to this function; the original path is kept in req.url.
  let path = url.pathname.replace(/^\/api/, '') || '/';
  if (path === '/router') path = '/' + (url.searchParams.get('path') || '');
  try {
    for (const [method, pattern, fn] of routes) {
      if (method !== req.method) continue;
      const params = match(pattern, path);
      if (!params) continue;
      await ensureSchema();
      const body = method === 'GET' ? {} : await readBody(req);
      return send(res, 200, await fn(req, body, params));
    }
    send(res, 404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: 'Something went wrong' });
  }
}
