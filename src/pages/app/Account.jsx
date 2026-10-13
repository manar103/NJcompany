// Profile, Settings, Notifications and Help pages.
import { useState } from 'react';
import { navigate } from '../../lib/router';
import { useDocumentTitle, useQuery, useSession, useStore } from '../../lib/hooks';
import { noteText, notifications as notesApi, profile as profileApi, profileCompletion } from '../../services/api';
import { useOpenAccountSecurity, useSignOut } from '../../lib/auth';
import { store } from '../../services/store';
import { CATEGORIES, COUNTRIES, LANGUAGES, SKILLS, proficiencyLabel } from '../../data/constants';
import { LANDING_FAQ } from '../../data/jobs';
import { fmtDate, initials, relative } from '../../lib/format';
import { PageHead } from '../../components/layout/AppShell';
import { INTEREST_OPTIONS, LanguageEditor, ResumePicker, TagSelect, WorkloadPicker } from '../../components/profile/ProfileFields';
import { Accordion, Badge, Button, EmptyState, ErrorState, Field, Icon, Input, LoadingCards, Progress, Select, Switch, Tabs, Textarea, useToast } from '../../components/ui';
import { t, translated } from '../../i18n';

/* ---------------- Profile ---------------- */
function useProfileForm(user) {
  const [p, setP] = useState(() => ({ languages: [], skills: [], interests: [], ...user.profile }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  const set = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const save = async (validate) => {
    const e = validate ? validate(p) : {};
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await profileApi.update(p);
    setBusy(false);
    setDirty(false);
    toast(t('Profile saved'));
  };
  return { p, set, errors, busy, dirty, save };
}

function SaveBar({ form, validate }) {
  return (
    <div className="save-bar">
      <span className="xs subtle">{form.dirty ? t('You have unsaved changes') : t('All changes saved')}</span>
      <Button loading={form.busy} disabled={!form.dirty} onClick={() => form.save(validate)} icon="save">
        {t('Save changes')}
      </Button>
    </div>
  );
}

export function Profile() {
  useDocumentTitle(t('My Profile'));
  const user = useSession();
  const form = useProfileForm(user);
  const { p, set, errors } = form;
  const completion = profileCompletion({ profile: p });
  const [tab, setTab] = useState('personal');

  const personal = (
    <div className="stack">
      <div className="form-grid">
        <Field label={t('Full name')} error={errors.fullName} className="span-2">
          <Input value={p.fullName || ''} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
        </Field>
        <Field label={t('Email')} hint={t('Change your email in Settings → Security.')}>
          <Input value={user.email} disabled />
        </Field>
        <Field label={t('Country or region')} error={errors.country}>
          <Select value={p.country || ''} onChange={(e) => set('country', e.target.value)} options={COUNTRIES} placeholder={t('Select country')} />
        </Field>
        <Field label={t('Preferred language')}>
          <Select value={p.preferredLanguage || ''} onChange={(e) => set('preferredLanguage', e.target.value)} options={LANGUAGES} placeholder={t('Select language')} />
        </Field>
        <Field label={t('Education or professional background')} optional>
          <Input value={p.background || ''} onChange={(e) => set('background', e.target.value)} />
        </Field>
      </div>
      <SaveBar form={form} validate={(x) => ({ ...(!x.fullName?.trim() && { fullName: t('Enter your full name.') }), ...(!x.country && { country: t('Select your country.') }) })} />
    </div>
  );

  const languages = (
    <div className="stack">
      <p className="small muted">{t('List every language you can work in. Proficiency is verified in project assessments.')}</p>
      <LanguageEditor value={p.languages} onChange={(v) => set('languages', v)} error={errors.languages} />
      <SaveBar form={form} validate={(x) => (x.languages.length ? {} : { languages: t('Add at least one language.') })} />
    </div>
  );

  const skills = (
    <div className="stack">
      <TagSelect label={t('Areas of interest')} options={INTEREST_OPTIONS} value={p.interests} onChange={(v) => set('interests', v)} />
      <TagSelect label={t('Skills')} options={SKILLS} value={p.skills} onChange={(v) => set('skills', v)} />
      <Field label={t('Relevant experience')} optional>
        <Textarea value={p.experienceSummary || ''} onChange={(e) => set('experienceSummary', e.target.value)} />
      </Field>
      <WorkloadPicker value={p.availability} onChange={(v) => set('availability', v)} />
      <div className="form-grid">
        <Field label={t('Hours per week')} optional>
          <Input type="number" min="1" max="60" value={p.hoursPerWeek || ''} onChange={(e) => set('hoursPerWeek', e.target.value)} />
        </Field>
      </div>
      <SaveBar form={form} />
    </div>
  );

  const resume = (
    <div className="stack">
      <ResumePicker value={p.resumeName || ''} onChange={(v) => (typeof v === 'object' ? null : set('resumeName', v))} />
      <Field label={t('Portfolio or LinkedIn URL')} optional error={errors.portfolioUrl}>
        <Input type="url" value={p.portfolioUrl || ''} onChange={(e) => set('portfolioUrl', e.target.value)} placeholder={t('https://')} />
      </Field>
      <SaveBar form={form} validate={(x) => (x.portfolioUrl && !/^https?:\/\/\S+\.\S+/.test(x.portfolioUrl) ? { portfolioUrl: t('Enter a full URL starting with https://') } : {})} />
    </div>
  );

  return (
    <>
      <PageHead title={t('My Profile')} description={t('Keep your details current so we can match you with relevant opportunities.')} />
      <div className="profile-layout">
        <aside className="card card-pad profile-summary">
          <span className="avatar lg">{initials(p.fullName || user.email)}</span>
          <h2>{p.fullName || t('Your name')}</h2>
          <p className="small subtle">{p.country ? t(p.country) : t('Country not set')} · {t('Member since {date}', { date: fmtDate(user.createdAt) })}</p>
          <div style={{ width: '100%', marginTop: 16 }}>
            <div className="row-between xs"><span>{t('Profile completion')}</span><strong>{completion}%</strong></div>
            <Progress value={completion} tone="sand" label={t('Profile completion')} />
          </div>
          <div className="divider" style={{ margin: '20px 0', width: '100%' }} />
          <div className="profile-langs">
            {p.languages.map((l) => (
              <div key={l.name} className="row-between small">
                <span>{t(l.name)}</span>
                <Badge tone={l.level === 'native' ? 'steel' : 'outline'}>{proficiencyLabel[l.level]}</Badge>
              </div>
            ))}
          </div>
          {p.interests.length > 0 && (
            <div className="row" style={{ gap: 6, marginTop: 16, justifyContent: 'center' }}>
              {p.interests.map((i) => <Badge key={i}>{CATEGORIES.find((c) => c.id === i)?.short}</Badge>)}
            </div>
          )}
        </aside>
        <div className="card card-pad">
          <Tabs
            label={t('Profile sections')}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'personal', label: t('Personal info'), content: personal },
              { id: 'languages', label: t('Languages'), content: languages },
              { id: 'skills', label: t('Skills & preferences'), content: skills },
              { id: 'resume', label: t('Resume & portfolio'), content: resume },
            ]}
          />
        </div>
      </div>
    </>
  );
}

/* ---------------- Settings ---------------- */
const NOTIF_PREFS = translated([
  { id: 'status', label: 'Application status changes', description: 'When an application moves to a new stage.' },
  { id: 'assessments', label: 'Assessment reminders', description: 'Reminders for assessments you have not finished.' },
  { id: 'deadlines', label: 'Project deadlines', description: 'A heads-up before projects you joined close.' },
  { id: 'recommendations', label: 'New matching opportunities', description: 'A weekly digest based on your languages.' },
  { id: 'announcements', label: 'Platform announcements', description: 'Occasional product and policy updates.' },
], 'label', 'description');

/** Passwords, email addresses, two-step verification and sessions are managed by Clerk. */
function SecurityTab() {
  const openAccount = useOpenAccountSecurity();
  return (
    <div className="stack settings-form">
      <h3 className="h-card">{t('Password & sign-in')}</h3>
      <p className="small muted">{t('Change your password, add two-step verification, connect sign-in providers and see where you are signed in.')}</p>
      {openAccount ? (
        <Button icon="shield" onClick={openAccount} style={{ alignSelf: 'flex-start' }}>{t('Manage account security')}</Button>
      ) : (
        <Badge tone="outline">{t('Sign-in is not configured yet')}</Badge>
      )}
    </div>
  );
}

function NotificationsTab() {
  const prefs = useStore((s) => s.prefs);
  const toast = useToast();
  const value = (id, ch) => prefs[`${id}:${ch}`] ?? (ch === 'inapp' || id !== 'recommendations');
  const toggle = (id, ch) => {
    store.set((s) => ({ ...s, prefs: { ...s.prefs, [`${id}:${ch}`]: !value(id, ch) } }));
    toast(t('Notification preference saved'));
  };
  return (
    <div className="pref-table" role="table" aria-label={t('Notification preferences')}>
      <div className="pref-row pref-head" role="row">
        <span role="columnheader">{t('Notification')}</span>
        <span role="columnheader">{t('Email')}</span>
        <span role="columnheader">{t('In-app')}</span>
      </div>
      {NOTIF_PREFS.map((n) => (
        <div className="pref-row" role="row" key={n.id}>
          <span role="cell">
            <strong className="small">{n.label}</strong>
            <span className="xs subtle" style={{ display: 'block' }}>{n.description}</span>
          </span>
          {['email', 'inapp'].map((ch) => (
            <span role="cell" key={ch}>
              <span className="switch">
                <input type="checkbox" role="switch" aria-label={t('{label} by {channel}', { label: n.label, channel: ch === 'email' ? t('email') : t('in-app notification') })} checked={value(n.id, ch)} onChange={() => toggle(n.id, ch)} />
                <span />
              </span>
            </span>
          ))}
        </div>
      ))}
      <p className="xs subtle" style={{ marginTop: 12 }}>{t('Preferences are saved in this browser.')}</p>
    </div>
  );
}

function PrivacyTab() {
  const prefs = useStore((s) => s.prefs);
  const user = useSession();
  const toast = useToast();
  const tog = (k, def) => {
    store.set((s) => ({ ...s, prefs: { ...s.prefs, [k]: !(s.prefs[k] ?? def) } }));
    toast(t('Privacy setting saved'));
  };
  const download = () => {
    const s = store.get();
    const data = {
      account: { email: user.email, createdAt: user.createdAt },
      profile: user.profile,
      applications: s.applications.filter((a) => a.userId === user.id),
      projects: s.projects.filter((p) => p.userId === user.id),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veralink-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="stack settings-form">
      <Switch label={t('Show my profile to project teams')} description={t('Reviewers can see your languages, skills and experience when you apply.')} checked={prefs.profileVisible ?? true} onChange={() => tog('profileVisible', true)} />
      <Switch label={t('Use my profile for recommendations')} description={t('We match opportunities to your languages and interests.')} checked={prefs.recommendations ?? true} onChange={() => tog('recommendations', true)} />
      <div className="divider" />
      <h3 className="h-card">{t('Your data')}</h3>
      <p className="small muted">{t('Download a copy of the profile and application data stored for your account.')}</p>
      <Button variant="secondary" icon="download" onClick={download} style={{ alignSelf: 'flex-start' }}>{t('Download my data (JSON)')}</Button>
    </div>
  );
}

function AccountTab() {
  const user = useSession();
  const openAccount = useOpenAccountSecurity();
  const signOut = useSignOut();
  return (
    <div className="stack settings-form">
      <Field label={t('Email address')} hint={t('Changing your email requires re-verification.')}>
        <Input type="email" value={user.email} disabled />
      </Field>
      {openAccount && (
        <Button variant="secondary" style={{ alignSelf: 'flex-start' }} onClick={openAccount}>
          {t('Update email')}
        </Button>
      )}
      <div className="divider" />
      <h3 className="h-card">{t('Log out')}</h3>
      <p className="small muted">{t('End your session on this device.')}</p>
      <Button variant="secondary" icon="logout" style={{ alignSelf: 'flex-start' }} onClick={signOut}>
        {t('Log out')}
      </Button>
    </div>
  );
}

export function Settings() {
  useDocumentTitle(t('Settings'));
  return (
    <>
      <PageHead title={t('Settings')} description={t('Manage your account security, notifications and privacy.')} />
      <div className="card card-pad">
        <Tabs
          label={t('Settings sections')}
          tabs={[
            { id: 'security', label: t('Security'), content: <SecurityTab /> },
            { id: 'notifications', label: t('Notifications'), content: <NotificationsTab /> },
            { id: 'privacy', label: t('Privacy'), content: <PrivacyTab /> },
            { id: 'account', label: t('Account'), content: <AccountTab /> },
          ]}
        />
      </div>
    </>
  );
}

/* ---------------- Notifications ---------------- */
const NOTE_ICON = { assessment: 'target', status: 'clipboard', deadline: 'calendar', announcement: 'megaphone' };

export function Notifications() {
  useDocumentTitle(t('Notifications'));
  const { data, loading, error, reload } = useQuery(() => notesApi.mine());
  const [filter, setFilter] = useState('all');
  const list = (data || []).filter((n) => filter === 'all' || !n.read);
  const unread = (data || []).filter((n) => !n.read).length;
  return (
    <>
      <PageHead
        title={t('Notifications')}
        description={t('Updates about your applications, assessments and projects.')}
        actions={unread > 0 && <Button variant="secondary" icon="check" onClick={() => notesApi.markAll()}>{t('Mark all as read')}</Button>}
      />
      <div className="card">
        <div style={{ padding: '8px 24px 0' }}>
          <Tabs label={t('Filter notifications')} value={filter} onChange={setFilter} tabs={[{ id: 'all', label: t('All'), count: data?.length ?? 0 }, { id: 'unread', label: t('Unread'), count: unread }]} />
        </div>
        {loading ? (
          <div className="card-body"><LoadingCards count={2} /></div>
        ) : error ? (
          <ErrorState onRetry={reload}>{error.message}</ErrorState>
        ) : list.length === 0 ? (
          <EmptyState icon="bell" title={filter === 'unread' ? t('No unread notifications') : t('No notifications yet')}>
            {filter === 'unread' ? t('You’re all caught up.') : t('Updates about your applications and projects will appear here.')}
          </EmptyState>
        ) : (
          <ul className="list notif-list">
            {list.map((n) => (
              <li key={n.id} data-unread={!n.read}>
                <button
                  type="button"
                  className="list-row"
                  onClick={() => {
                    notesApi.markRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <span className="icon-tile sm steel"><Icon name={NOTE_ICON[n.type] || 'bell'} /></span>
                  <span className="grow">
                    <span className="list-title">{noteText(n).title}{!n.read && <span className="sr-only"> {t('(unread)')}</span>}</span>
                    <span className="list-sub">{noteText(n).body}</span>
                  </span>
                  <span className="xs subtle nowrap">{relative(n.at)}</span>
                  {!n.read && <span className="unread-dot" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/* ---------------- Help ---------------- */
export function Help() {
  useDocumentTitle(t('Help & Support'));
  const [q, setQ] = useState('');
  const faqs = LANDING_FAQ.filter((f) => !q || (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title={t('Help & Support')} description={t('Find answers or get in touch with the support team.')} />
      <div className="help-grid">
        <div className="card card-pad">
          <div className="input-group" style={{ marginBottom: 12 }}>
            <Icon name="search" />
            <label htmlFor="help-q" className="sr-only">{t('Search help articles')}</label>
            <input id="help-q" className="input" type="search" placeholder={t('Search help')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {faqs.length ? <Accordion items={faqs} /> : <EmptyState icon="search" title={t('No matching answers')}>{t('Try different words, or contact support.')}</EmptyState>}
        </div>
        <aside className="stack">
          {[
            { icon: 'mail', t: 'Contact support', d: 'Questions about your account or an application.', to: '/page/contact', cta: 'Send a message' },
            { icon: 'file', t: 'Contributor guidelines', d: 'Quality standards and privacy rules for all projects.', to: '/page/help', cta: 'Read guidelines' },
            { icon: 'shield', t: 'Privacy & data', d: 'Download your data or update privacy settings.', to: '/app/settings', cta: 'Open settings' },
          ].map((c) => (
            <div className="card card-pad" key={c.t}>
              <span className="icon-tile sm sand"><Icon name={c.icon} /></span>
              <h3 className="h-card" style={{ marginTop: 12 }}>{t(c.t)}</h3>
              <p className="small muted" style={{ margin: '4px 0 12px' }}>{t(c.d)}</p>
              <Button to={c.to} variant="secondary" size="sm">{t(c.cta)}</Button>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
