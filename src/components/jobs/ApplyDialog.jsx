import { useState } from 'react';
import { applications } from '../../services/api';
import { navigate } from '../../lib/router';
import { Alert, Button, Checkbox, Dialog, Field, Icon, Select, Textarea, useToast } from '../ui';
import { proficiencyLabel } from '../../data/constants';
import { t, tx } from '../../i18n';

const HOURS = ['Under 5 hours / week', '5–10 hours / week', '10–20 hours / week', '20+ hours / week'];

export default function ApplyDialog({ job, open, onClose, draft }) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    confirmed: draft?.answers?.confirmed || [],
    motivation: draft?.answers?.motivation || '',
    hours: draft?.answers?.hours || '',
    consent: false,
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [done, setDone] = useState(null);
  const [apiError, setApiError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleReq = (r) => set('confirmed', form.confirmed.includes(r) ? form.confirmed.filter((x) => x !== r) : [...form.confirmed, r]);

  const validate = () => {
    const e = {};
    if (form.confirmed.length !== job.mandatory.length) e.confirmed = t('Confirm each mandatory requirement to apply. If you do not meet one, this project may not be the right fit.');
    if (form.motivation.trim().length < 40) e.motivation = t('Please write at least 40 characters about your relevant experience.');
    if (!form.hours) e.hours = t('Select your expected availability.');
    if (!form.consent) e.consent = t('You must acknowledge the application terms.');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (asDraft) => {
    setApiError('');
    if (!asDraft && !validate()) return;
    setBusy(asDraft ? 'draft' : 'submit');
    try {
      const app = await applications.submit(job.id, { confirmed: form.confirmed, motivation: form.motivation, hours: form.hours }, { draft: asDraft });
      if (asDraft) {
        toast(t('Draft saved. You can finish it from My Applications.'), { icon: 'save' });
        onClose();
      } else setDone(app);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (done) {
    const needsAssessment = done.status === 'assessment_required';
    return (
      <Dialog open={open} onClose={onClose} title={t('Application submitted')}>
        <div className="apply-success">
          <span className="icon-tile navy">
            <Icon name="checkCircle" />
          </span>
          <p>{tx('Your application for {title} has been submitted.', { title: <strong>{job.title}</strong> })}</p>
          {needsAssessment ? (
            <Alert tone="warning" title={t('Next step: complete the assessment')}>
              {t('This project requires the {name} (about {duration}). Your application will be reviewed after you complete it.', { name: job.assessment.name, duration: job.assessment.duration })}
            </Alert>
          ) : (
            <Alert tone="info" title={t('What happens next')}>
              {t('The project team reviews applications in the order they arrive. You will see status changes in your dashboard. Applying does not guarantee acceptance.')}
            </Alert>
          )}
        </div>
        <div className="dialog-footer" style={{ padding: '16px 0 8px' }}>
          <Button variant="secondary" onClick={() => navigate(`/app/applications/${done.id}`)}>
            {t('View application')}
          </Button>
          {needsAssessment && (
            <Button iconRight="arrowRight" onClick={() => navigate(`/app/assessments/${done.id}`)}>
              {t('Start assessment')}
            </Button>
          )}
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={t('Apply: {title}', { title: job.title })}
      description={t('Answer a few questions so the project team can review your fit. All fields are needed to submit — you can save a draft at any time.')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button variant="secondary" icon="save" loading={busy === 'draft'} disabled={!!busy} onClick={() => submit(true)}>
            {t('Save as draft')}
          </Button>
          <Button iconRight="send" loading={busy === 'submit'} disabled={!!busy} onClick={() => submit(false)}>
            {t('Submit application')}
          </Button>
        </>
      }
    >
      <form className="stack" onSubmit={(e) => { e.preventDefault(); submit(false); }} noValidate>
        {apiError && <Alert tone="danger">{apiError}</Alert>}
        <fieldset className="apply-reqs">
          <legend className="field-label">{t('Mandatory requirements')}</legend>
          <p className="field-hint" style={{ marginBottom: 10 }}>
            {t('Required languages:')} {job.languages.map((l) => `${t(l.name)} (${proficiencyLabel[l.level]})`).join(t(', '))}
          </p>
          <div className="stack-sm">
            {job.mandatory.map((r) => (
              <Checkbox key={r} label={r} checked={form.confirmed.includes(r)} onChange={() => toggleReq(r)} />
            ))}
          </div>
          {errors.confirmed && (
            <p className="field-error" role="alert" style={{ marginTop: 8 }}>
              <Icon name="alertCircle" /> {errors.confirmed}
            </p>
          )}
        </fieldset>
        <Field label={t('Relevant experience')} hint={t('Briefly describe experience related to this project (40+ characters).')} error={errors.motivation}>
          <Textarea value={form.motivation} onChange={(e) => set('motivation', e.target.value)} placeholder={t('e.g. I have recorded voice-overs for two years and have a quiet home studio…')} />
        </Field>
        <Field label={t('Expected availability')} error={errors.hours}>
          <Select value={form.hours} onChange={(e) => set('hours', e.target.value)} options={HOURS} placeholder={t('Select availability')} />
        </Field>
        <div>
          <Checkbox
            label={t('I understand that applying does not guarantee acceptance, and that project terms — including compensation — are confirmed in the project agreement.')}
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={errors.consent ? 'true' : undefined}
          />
          {errors.consent && (
            <p className="field-error" role="alert" style={{ marginTop: 6 }}>
              <Icon name="alertCircle" /> {errors.consent}
            </p>
          )}
        </div>
      </form>
    </Dialog>
  );
}
