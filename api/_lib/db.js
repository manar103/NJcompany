// Neon Postgres client and schema. Records keep the same JSON shapes the frontend uses;
// the columns pulled out of `data` are the ones queries filter or join on.
import { neon } from '@neondatabase/serverless';

let client;
function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  client ??= neon(process.env.DATABASE_URL);
  return client;
}

/** Tagged-template query: await sql`select * from jobs where id = ${id}` (values are parameterized). */
export const sql = (strings, ...values) => db()(strings, ...values);

const SCHEMA = [
  `create table if not exists users (
     id text primary key,                 -- Clerk user id
     email text not null default '',
     role text not null default 'contributor',
     onboarded boolean not null default false,
     profile jsonb not null default '{}'::jsonb,
     created_at timestamptz not null default now()
   )`,
  `create table if not exists jobs (
     id text primary key,
     status text not null default 'open',
     data jsonb not null,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,
  `create table if not exists applications (
     id text primary key,
     job_id text not null references jobs(id) on delete cascade,
     user_id text not null references users(id) on delete cascade,
     status text not null,
     data jsonb not null,                 -- answers, history, assessment
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,
  `create index if not exists applications_user_idx on applications(user_id)`,
  `create index if not exists applications_job_idx on applications(job_id)`,
  `create table if not exists projects (
     id text primary key,
     application_id text not null unique references applications(id) on delete cascade,
     job_id text not null references jobs(id) on delete cascade,
     user_id text not null references users(id) on delete cascade,
     data jsonb not null,                 -- status, done, total, dates
     created_at timestamptz not null default now()
   )`,
  `create index if not exists projects_user_idx on projects(user_id)`,
  `create table if not exists notifications (
     id text primary key,
     user_id text not null,               -- a user id, or '*' for everyone
     read_by text[] not null default '{}',-- for '*' notifications: who has read it
     data jsonb not null,                 -- type, title, body, vars, link
     created_at timestamptz not null default now()
   )`,
  `create index if not exists notifications_user_idx on notifications(user_id)`,
  `create table if not exists announcements (
     id text primary key,
     title text not null,
     body text not null,
     created_by text,
     created_at timestamptz not null default now()
   )`,
];

let ready;
/** Create tables on first use (cheap no-ops afterwards). */
export function ensureSchema() {
  ready ??= (async () => {
    for (const stmt of SCHEMA) await db().query(stmt);
  })().catch((e) => {
    ready = undefined;
    throw e;
  });
  return ready;
}

export const uid = (prefix) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
export const today = () => new Date().toISOString().slice(0, 10);
