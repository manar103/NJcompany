import { useMemo, useState } from 'react';
import { Link, navigate } from '../../lib/router';
import { useDocumentTitle, useQuery, useStore } from '../../lib/hooks';
import { applications as appsApi, assessments as assessApi } from '../../services/api';
import { ASSESSMENTS } from '../../data/jobs';
import { categoryById } from '../../data/constants';
import { fmtDate, relative } from '../../lib/format';
import { PageHead } from '../../components/layout/AppShell';
import Recorder, { SpeakButton } from '../../components/workspace/Recorder';
import { Alert, Badge, Button, Dialog, EmptyState, ErrorState, Field, Icon, LoadingCards, Progress, Textarea, useToast } from '../../components/ui';
import { t, tx } from '../../i18n';

export default function Assessments() {
  useDocumentTitle(t('Assessments'));
  const { data, loading, error, reload } = useQuery(() => appsApi.mine());
  const jobs = useStore((s) => s.jobs);
  const drafts = useStore((s) => s.drafts);
  const jobById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs]);

  const withAssessment = (data || []).filter((a) => a.assessment && a.status !== 'withdrawn' && jobById[a.jobId]?.assessment?.required);
  const todo = withAssessment.filter((a) => a.assessment.status !== 'completed');
  const done = withAssessment.filter((a) => a.assessment.status === 'completed');

  const Item = ({ a }) => {
    const job = jobById[a.jobId];
    const meta = ASSESSMENTS[job.assessment.id];
    const saved = drafts[`assess:${a.id}`];
    const answered = saved ? Object.keys(saved.answers || {}).length : 0;
    const completed = a.assessment.status === 'completed';
    return (
      <li className="card card-pad assess-item">
        <span className="icon-tile steel"><Icon name={categoryById[job.category].icon} /></span>
        <div className="grow">
          <div className="row" style={{ gap: 8 }}>
            <h3 className="h-card">{meta.name}</h3>
            {completed ? <Badge tone="steel">{t('Completed')}</Badge> : saved ? <Badge tone="sand">{t('In progress')}</Badge> : <Badge>{t('Not started')}</Badge>}
          </div>
          <p className="small muted" style={{ marginTop: 4 }}>{tx('For {title}', { title: <Link to={`/app/applications/${a.id}`}>{job.title}</Link> })}</p>
          <p className="xs subtle" style={{ marginTop: 6 }}>
            <Icon name="clock" size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('About {duration} · {n} questions', { duration: meta.duration, n: meta.questions.length })}
            {saved && !completed && ` · ${t('{done}/{total} answered, saved {when}', { done: answered, total: meta.questions.length, when: relative(saved.savedAt) })}`}
            {completed && ` · ${t('Completed {date}', { date: fmtDate(a.assessment.completedAt) })}`}
          </p>
        </div>
        {!completed && (
          <Button to={`/app/assessments/${a.id}`} iconRight="arrowRight">
            {saved ? t('Continue') : t('Start')}
          </Button>
        )}
      </li>
    );
  };

  return (
    <>
      <PageHead title={t('Assessments')} description={t('Some projects ask you to complete a short assessment so reviewers can confirm the skills a task needs.')} />
      {loading ? (
        <LoadingCards count={2} />
      ) : error ? (
        <div className="card"><ErrorState onRetry={reload}>{error.message}</ErrorState></div>
      ) : withAssessment.length === 0 ? (
        <div className="card">
          <EmptyState icon="target" title={t('No assessments yet')} actions={<Button to="/app/opportunities" variant="secondary">{t('Browse opportunities')}</Button>}>
            {t('When you apply to a project that requires an assessment, it will appear here.')}
          </EmptyState>
        </div>
      ) : (
        <div className="stack">
          <h2 className="h-sec">{t('To complete ({n})', { n: todo.length })}</h2>
          {todo.length ? <ul className="stack">{todo.map((a) => <Item key={a.id} a={a} />)}</ul> : <p className="small subtle">{t('You’re all caught up.')}</p>}
          {done.length > 0 && (
            <>
              <h2 className="h-sec" style={{ marginTop: 32 }}>{t('Completed ({n})', { n: done.length })}</h2>
              <ul className="stack">{done.map((a) => <Item key={a.id} a={a} />)}</ul>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Question({ q, value, onChange }) {
  if (q.type === 'choice')
    return (
      <fieldset>
        <legend className="q-prompt">{q.prompt}</legend>
        <div className="choice-list">
          {q.options.map((o) => (
            <label key={o} className="choice">
              <input type="radio" name={q.id} checked={value === o} onChange={() => onChange(o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  if (q.type === 'mic')
    return (
      <div className="stack">
        <p className="q-prompt">{q.prompt}</p>
        <blockquote className="sample-quote">{q.sample}</blockquote>
        <Recorder onRecorded={({ seconds }) => onChange(t('Recorded {s}s on device', { s: seconds.toFixed(1) }))} />
        {value && <Alert tone="success">{t('Recording check completed.')}</Alert>}
      </div>
    );
  if (q.type === 'listen')
    return (
      <div className="stack">
        <p className="q-prompt">{q.prompt}</p>
        <SpeakButton text={q.sample} />
        <Field label={t('Your transcript')}>
          <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={t('Type exactly what you hear…')} />
        </Field>
      </div>
    );
  if (q.type === 'translate')
    return (
      <div className="stack">
        <p className="q-prompt">{q.prompt}</p>
        <blockquote className="sample-quote" lang="en">{q.sample}</blockquote>
        <Field label={t('Your translation')}>
          <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      </div>
    );
  return (
    <Field label={q.prompt}>
      <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function AssessmentRunner({ id }) {
  const { data: app, loading, error, reload } = useQuery(() => appsApi.get(id), [id]);
  const jobs = useStore((s) => s.jobs);
  const toast = useToast();
  const job = app && jobs.find((j) => j.id === app.jobId);
  const meta = job?.assessment?.required ? ASSESSMENTS[job.assessment.id] : null;
  useDocumentTitle(meta?.name || t('Assessment'));

  const saved = useMemo(() => assessApi.loadProgress(id), [id]);
  const [started, setStarted] = useState(!!saved);
  const [answers, setAnswers] = useState(saved?.answers || {});
  const [idx, setIdx] = useState(saved?.idx || 0);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (loading) return <LoadingCards count={1} />;
  if (error) return <div className="card"><ErrorState onRetry={reload}>{error.message}</ErrorState></div>;
  if (!meta)
    return (
      <div className="card">
        <EmptyState icon="target" title={t('No assessment for this application')} actions={<Button to="/app/assessments" variant="secondary">{t('Back to assessments')}</Button>} />
      </div>
    );

  const completed = app.assessment?.status === 'completed';
  const q = meta.questions[idx];
  const answeredCount = meta.questions.filter((x) => answers[x.id] && String(answers[x.id]).trim()).length;
  const setAnswer = (v) => {
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    assessApi.saveProgress(id, { answers: next, idx });
  };
  const go = (n) => {
    setIdx(n);
    assessApi.saveProgress(id, { answers, idx: n });
  };
  const submit = async () => {
    setBusy(true);
    await assessApi.submit(id);
    setBusy(false);
    setConfirm(false);
    setSubmitted(true);
    toast(t('Assessment submitted'));
  };

  if (submitted || completed)
    return (
      <div className="card card-pad assess-done">
        <span className="icon-tile navy"><Icon name="checkCircle" /></span>
        <h1>{t('Assessment submitted')}</h1>
        <p className="muted">
          {tx('Your {name} for {title} has been recorded. Your application is now {status}. Results are not shown immediately — you will be notified when a decision is made.', { name: meta.name, title: <strong>{job.title}</strong>, status: <strong>{t('under review')}</strong> })}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button to={`/app/applications/${app.id}`} variant="secondary">{t('View application')}</Button>
          <Button to="/app/assessments">{t('Back to assessments')}</Button>
        </div>
      </div>
    );

  if (!started)
    return (
      <>
        <nav className="breadcrumb" aria-label={t('Breadcrumb')}>
          <Link to="/app/assessments">{t('Assessments')}</Link>
          <Icon name="chevronRight" />
          <span>{meta.name}</span>
        </nav>
        <div className="card assess-intro">
          <div className="card-pad stack">
            <span className="eyebrow">{t('Assessment')} · {job.title}</span>
            <h1>{meta.name}</h1>
            <p className="muted">{meta.intro}</p>
            <div className="intro-facts">
              <div><Icon name="clock" /><span><strong>{t('About {duration}', { duration: meta.duration })}</strong>{t('No strict time limit')}</span></div>
              <div><Icon name="clipboard" /><span><strong>{t('{n} questions', { n: meta.questions.length })}</strong>{t('Multiple choice and written')}</span></div>
              <div><Icon name="save" /><span><strong>{t('Auto-saved')}</strong>{t('Leave and continue later')}</span></div>
            </div>
            <Alert tone="info" title={t('Before you begin')}>
              {t('Work on your own, in a quiet place. Answers can be changed until you submit. Once submitted, the assessment cannot be retaken for this application.')}
            </Alert>
            <div className="row">
              <Button size="lg" iconRight="arrowRight" onClick={() => setStarted(true)}>{t('Begin assessment')}</Button>
              <Button variant="ghost" to="/app/assessments">{t('Not now')}</Button>
            </div>
          </div>
        </div>
      </>
    );

  return (
    <>
      <div className="assess-head">
        <div>
          <span className="eyebrow">{meta.name}</span>
          <p className="small muted">{job.title}</p>
        </div>
        <Button variant="ghost" size="sm" icon="save" onClick={() => { assessApi.saveProgress(id, { answers, idx }); toast(t('Progress saved — you can continue later'), { icon: 'save' }); navigate('/app/assessments'); }}>
          {t('Save & exit')}
        </Button>
      </div>
      <div className="assess-progress">
        <span className="small">{tx('{q} of {total}', { q: <strong>{t('Question {n}', { n: idx + 1 })}</strong>, total: meta.questions.length })}</span>
        <span className="xs subtle">{t('{n} answered · saved automatically', { n: answeredCount })}</span>
      </div>
      <Progress value={((idx + 1) / meta.questions.length) * 100} label={t('Assessment progress')} />
      <nav className="q-dots" aria-label={t('Questions')}>
        {meta.questions.map((x, i) => (
          <button key={x.id} type="button" onClick={() => go(i)} aria-current={i === idx ? 'step' : undefined} data-answered={!!answers[x.id]} aria-label={`${t('Question {n}', { n: i + 1 })}${answers[x.id] ? t(', answered') : ''}`}>
            {i + 1}
          </button>
        ))}
      </nav>
      <section className="card card-pad q-card" aria-live="polite">
        <Question key={q.id} q={q} value={answers[q.id]} onChange={setAnswer} />
      </section>
      <div className="row-between" style={{ marginTop: 20 }}>
        <Button variant="secondary" icon="arrowLeft" disabled={idx === 0} onClick={() => go(idx - 1)}>{t('Previous')}</Button>
        {idx < meta.questions.length - 1 ? (
          <Button iconRight="arrowRight" onClick={() => go(idx + 1)}>{t('Next question')}</Button>
        ) : (
          <Button iconRight="send" onClick={() => setConfirm(true)}>{t('Review & submit')}</Button>
        )}
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('Submit your assessment?')}
        description={t('After submitting you won’t be able to change your answers.')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t('Keep working')}</Button>
            <Button loading={busy} onClick={submit} disabled={answeredCount < meta.questions.length}>{t('Submit assessment')}</Button>
          </>
        }
      >
        {answeredCount < meta.questions.length ? (
          <Alert tone="warning" title={t('{n} question(s) unanswered', { n: meta.questions.length - answeredCount })}>
            {t('Answer every question before submitting. Unanswered:')}{' '}
            {meta.questions.map((x, i) => (!answers[x.id] ? i + 1 : null)).filter(Boolean).join(', ')}
          </Alert>
        ) : (
          <Alert tone="success">{t('All {n} questions answered.', { n: meta.questions.length })}</Alert>
        )}
      </Dialog>
    </>
  );
}
