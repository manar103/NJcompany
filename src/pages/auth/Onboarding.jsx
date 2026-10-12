import { useState } from 'react';
import { Link, navigate, useLocation } from '../../lib/router';
import { useDocumentTitle, useSession } from '../../lib/hooks';
import { profile as profileApi } from '../../services/api';
import { COUNTRIES, LANGUAGES, SKILLS } from '../../data/constants';
import { Alert, Button, Field, Input, Logo, Select, Stepper, Textarea, useToast } from '../../components/ui';
import { INTEREST_OPTIONS, LanguageEditor, ResumePicker, TagSelect, WorkloadPicker } from '../../components/profile/ProfileFields';
import Preferences from '../../components/layout/Preferences';
import { t } from '../../i18n';

const STEPS = ['About you', 'Languages', 'Skills & interests', 'Background', 'Availability'];
const TIMEZONES = ['UTC−08:00 Pacific', 'UTC−05:00 Eastern', 'UTC−03:00 São Paulo', 'UTC+00:00 London', 'UTC+01:00 Lagos', 'UTC+02:00 Cairo', 'UTC+03:00 Nairobi / Riyadh', 'UTC+05:30 India', 'UTC+07:00 Jakarta', 'UTC+08:00 Manila', 'UTC+09:00 Tokyo'];

function validateStep(step, p) {
  const e = {};
  if (step === 0) {
    if (!p.fullName?.trim() || p.fullName.trim().length < 2) e.fullName = t('Enter your full name.');
    if (!p.country) e.country = t('Select your country or region.');
    if (!p.preferredLanguage) e.preferredLanguage = t('Select the language you prefer for communication.');
  }
  if (step === 1) {
    if (!p.languages?.length) e.languages = t('Add at least one language.');
  }
  if (step === 2) {
    if (!p.skills?.length) e.skills = t('Select at least one skill.');
    if (!p.interests?.length) e.interests = t('Select at least one area of interest.');
  }
  if (step === 3) {
    if (p.portfolioUrl && !/^https?:\/\/\S+\.\S+/.test(p.portfolioUrl)) e.portfolioUrl = t('Enter a full URL starting with https://');
  }
  if (step === 4) {
    if (!p.availability) e.availability = t('Choose a preferred workload.');
  }
  return e;
}

export default function Onboarding() {
  useDocumentTitle(t('Set up your profile'));
  const user = useSession();
  const { query } = useLocation();
  const toast = useToast();
  const [step, setStep] = useState(() => Math.min(user?.profile?.onboardingStep || 0, STEPS.length - 1));
  const [p, setP] = useState(() => {
    const existing = user?.profile || {};
    return { skills: [], interests: [], ...existing, languages: existing.languages?.length ? existing.languages : [{ name: 'English', level: 'fluent' }] };
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!user) return null; // route guard redirects to login

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const save = async (nextStep, finish = false) => {
    await profileApi.update({ ...p, onboardingStep: nextStep }, finish ? { onboarded: true } : {});
  };

  const next = async () => {
    const e = validateStep(step, p);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const last = step === STEPS.length - 1;
    await save(last ? step : step + 1, last);
    setBusy(false);
    if (last) {
      toast(t('Profile complete — welcome to VERALINK!'));
      navigate(query.get('next') || '/app');
    } else {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    }
  };

  const saveExit = async () => {
    setBusy(true);
    await save(step);
    setBusy(false);
    toast(t('Progress saved. You can finish your profile any time.'), { icon: 'save' });
    navigate('/app');
  };

  return (
    <div className="onb-shell">
      <header className="onb-head">
        <div className="container">
          <Link to="/" aria-label={t('VERALINK home')}>
            <Logo size={30} />
          </Link>
          <div className="row" style={{ gap: 4 }}>
            <Preferences />
            <Button variant="ghost" size="sm" onClick={saveExit} disabled={busy}>
              {t('Save & finish later')}
            </Button>
          </div>
        </div>
      </header>
      <main className="onb-body" id="main">
        <span className="eyebrow">{t('Step {n} of {total}', { n: step + 1, total: STEPS.length })}</span>
        <h1 style={{ fontSize: 'var(--fs-2xl)', marginTop: 8 }}>{t(['Tell us about yourself', 'Which languages do you speak?', 'Your skills and interests', 'Background & portfolio', 'Your availability'][step])}</h1>
        <p className="muted small" style={{ marginTop: 6, marginBottom: 24 }}>
          {t([
            'We use this to show opportunities available in your region. We only ask for what projects need.',
            'Add every language you can work in. Be accurate — many projects verify proficiency in an assessment.',
            'Pick the kinds of work you are interested in and the skills you already have.',
            'Optional, but helps reviewers understand your experience.',
            'Tell us how much time you would like to spend on projects. You can change this later.',
          ][step])}
        </p>
        <Stepper steps={STEPS.map((s) => t(s))} current={step} />

        <form className="card onb-card" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
          <div className="card-body stack">
            {step === 0 && (
              <div className="form-grid">
                <Field label={t('Full name')} error={errors.fullName} className="span-2">
                  <Input value={p.fullName || ''} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
                </Field>
                <Field label={t('Country or region')} error={errors.country}>
                  <Select value={p.country || ''} onChange={(e) => set('country', e.target.value)} options={COUNTRIES} placeholder={t('Select country')} autoComplete="country-name" />
                </Field>
                <Field label={t('Preferred language')} hint={t('For emails and support.')} error={errors.preferredLanguage}>
                  <Select value={p.preferredLanguage || ''} onChange={(e) => set('preferredLanguage', e.target.value)} options={LANGUAGES} placeholder={t('Select language')} />
                </Field>
              </div>
            )}

            {step === 1 && (
              <>
                <LanguageEditor value={p.languages} onChange={(v) => set('languages', v)} error={errors.languages} />
                <Alert tone="info">{t('“Native” means you grew up speaking the language. Professional and above means you can work comfortably in it.')}</Alert>
              </>
            )}

            {step === 2 && (
              <>
                <TagSelect label={t('Areas of interest')} options={INTEREST_OPTIONS} value={p.interests} onChange={(v) => set('interests', v)} error={errors.interests} />
                <TagSelect label={t('Skills')} hint={t('Select all that apply.')} options={SKILLS} value={p.skills} onChange={(v) => set('skills', v)} error={errors.skills} />
                <Field label={t('Relevant experience')} optional hint={t('Two or three sentences is enough.')}>
                  <Textarea value={p.experienceSummary || ''} onChange={(e) => set('experienceSummary', e.target.value)} />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label={t('Education or professional background')} optional>
                  <Input value={p.background || ''} onChange={(e) => set('background', e.target.value)} placeholder={t('e.g. BA in Linguistics, freelance translator')} />
                </Field>
                <Field label={t('Portfolio or LinkedIn URL')} optional error={errors.portfolioUrl}>
                  <Input type="url" value={p.portfolioUrl || ''} onChange={(e) => set('portfolioUrl', e.target.value)} placeholder={t('https://')} />
                </Field>
                <ResumePicker value={p.resumeName || ''} onChange={(v) => (typeof v === 'object' ? setErrors({ resume: v.error }) : set('resumeName', v))} />
                {errors.resume && <Alert tone="danger">{errors.resume}</Alert>}
              </>
            )}

            {step === 4 && (
              <>
                <WorkloadPicker value={p.availability} onChange={(v) => set('availability', v)} />
                {errors.availability && <p className="field-error" role="alert">{errors.availability}</p>}
                <div className="form-grid">
                  <Field label={t('Hours available per week')} optional>
                    <Input type="number" min="1" max="60" value={p.hoursPerWeek || ''} onChange={(e) => set('hoursPerWeek', e.target.value)} />
                  </Field>
                  <Field label={t('Time zone')} optional>
                    <Select value={p.timezone || ''} onChange={(e) => set('timezone', e.target.value)} options={TIMEZONES} placeholder={t('Select time zone')} />
                  </Field>
                </div>
              </>
            )}
          </div>
          <div className="onb-foot">
            <Button variant="ghost" icon="arrowLeft" onClick={() => setStep(step - 1)} disabled={step === 0 || busy}>
              {t('Back')}
            </Button>
            <div className="row">
              <span className="xs subtle">{t('Progress is saved each step')}</span>
              <Button type="submit" loading={busy} iconRight={step === STEPS.length - 1 ? 'check' : 'arrowRight'}>
                {step === STEPS.length - 1 ? t('Finish setup') : t('Save & continue')}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
