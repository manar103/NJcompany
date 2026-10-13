// Request authentication: verifies the Clerk session token sent by the browser and loads
// the matching user row. Roles are decided here on the server, never trusted from the client.
import { createClerkClient, verifyToken } from '@clerk/backend';
import { sql } from './db.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Returns the Clerk user id for a valid `Authorization: Bearer <token>` header, else null. */
export async function sessionUserId(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return payload.sub || null;
  } catch {
    return null;
  }
}

/** The signed-in user's row, or null. */
export async function currentUser(req) {
  const id = await sessionUserId(req);
  if (!id) return null;
  const rows = await sql`select * from users where id = ${id}`;
  return rows[0] || null;
}

export async function requireUser(req) {
  const user = await currentUser(req);
  if (!user) throw new HttpError(401, 'Please sign in to continue.');
  return user;
}

export async function requireAdmin(req) {
  const user = await requireUser(req);
  if (user.role !== 'admin') throw new HttpError(403, 'Only admins can do this.');
  return user;
}

/**
 * Create or refresh the user row from Clerk. Email, name and role come from Clerk's
 * servers (not the request body), so a client cannot make itself an admin.
 */
export async function syncUser(req) {
  const id = await sessionUserId(req);
  if (!id) throw new HttpError(401, 'Please sign in to continue.');
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const cu = await clerk.users.getUser(id);
  const email = (cu.primaryEmailAddress?.emailAddress || cu.emailAddresses?.[0]?.emailAddress || '').toLowerCase();
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(' ');
  const role = cu.publicMetadata?.role === 'admin' || adminEmails().includes(email) ? 'admin' : 'contributor';
  const profile = { fullName: name, languages: [], skills: [], interests: [] };
  const rows = await sql`
    insert into users (id, email, role, onboarded, profile)
    values (${id}, ${email}, ${role}, ${role === 'admin'}, ${JSON.stringify(profile)}::jsonb)
    on conflict (id) do update set
      email = excluded.email,
      role = excluded.role,
      onboarded = users.onboarded or excluded.role = 'admin',
      profile = case when coalesce(users.profile->>'fullName', '') = '' and ${name} <> ''
                     then jsonb_set(users.profile, '{fullName}', to_jsonb(${name}::text))
                     else users.profile end
    returning *`;
  return rows[0];
}
