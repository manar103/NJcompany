import { useEffect } from 'react';
import { Link, useLocation } from '../../lib/router';
import { useDocumentTitle, useStore } from '../../lib/hooks';
import { CATEGORIES } from '../../data/constants';
import { LANDING_FAQ } from '../../data/jobs';
import HeroVisual from '../../components/HeroVisual';
import JobCard from '../../components/jobs/JobCard';
import { Accordion, Button, Icon, SampleBadge, StatusBadge } from '../../components/ui';
import { translated } from '../../i18n';
import { t, tn, tx } from '../../i18n';

const VALUES = translated([
  { icon: 'layers', title: 'Many kinds of work', text: 'Voice, transcription, translation, annotation, data collection and AI evaluation — in one place.' },
  { icon: 'globe', title: 'Built for every language', text: 'Projects are organized by language, dialect and region, so you see work you can actually do.' },
  { icon: 'shield', title: 'Transparent requirements', text: 'Eligibility, equipment, assessments and payment terms are listed before you apply.' },
  { icon: 'route', title: 'Track everything', text: 'Follow every application, assessment and project from a single dashboard.' },
], 'title', 'text');

const STEPS = translated([
  { title: 'Create your account', text: 'Sign up with your email and verify your address. It takes about a minute.' },
  { title: 'Complete your profile', text: 'Add your languages, proficiency levels, skills and availability.' },
  { title: 'Browse & assess', text: 'Find opportunities that match you and complete any required assessments.' },
  { title: 'Apply & track', text: 'Apply, follow your status, and work on projects once you are accepted.' },
], 'title', 'text');

const WHY = translated([
  { icon: 'clipboard', title: 'A simple application', text: 'Short, structured applications with draft saving — no lengthy forms for every project.' },
  { icon: 'target', title: 'Relevant opportunities', text: 'Recommendations based on the languages and skills in your profile.' },
  { icon: 'file', title: 'Clear requirements', text: 'Mandatory and preferred qualifications are always separated, so you know where you stand.' },
  { icon: 'bell', title: 'Centralized tracking', text: 'Status changes, deadlines and next steps are visible in one dashboard.' },
], 'title', 'text');

function DashboardPreview() {
  const rows = [
    { t: 'Conversational Speech — Arabic', s: 'accepted' },
    { t: 'Medical Transcription — English', s: 'under_review' },
    { t: 'Video Action Labeling', s: 'assessment_required' },
  ];
  return (
    <div className="why-preview" aria-hidden="true">
      <div className="wp-head">
        <span className="wp-dot" />
        <span className="wp-dot" />
        <span className="wp-dot" />
        <span className="wp-title">{t('My Applications')}</span>
      </div>
      <div className="wp-body">
        {rows.map((r) => (
          <div className="wp-row" key={r.t}>
            <span className="icon-tile sm steel">
              <Icon name="briefcase" />
            </span>
            <span className="wp-text">{t(r.t)}</span>
            <StatusBadge status={r.s} />
          </div>
        ))}
        <div className="wp-progress">
          <span className="small">{t('Profile completion')}</span>
          <div className="progress sand">
            <span style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  useDocumentTitle();
  const { query } = useLocation();
  const allJobs = useStore((s) => s.jobs);
  const featured = allJobs.filter((j) => j.featured && j.status === 'open').slice(0, 4);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, allJobs.filter((j) => j.category === c.id && j.status === 'open').length]));

  // Section links from the header use ?s=<section-id>.
  const section = query.get('s');
  useEffect(() => {
    if (!section) return;
    const el = document.getElementById(section);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  }, [section]);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> {t('Global AI work opportunities')}
            </span>
            <h1>{t('Your Skills Can Help Shape the Future of AI.')}</h1>
            <p className="hero-lead">
              {t('Discover global opportunities in AI training, voice recording, transcription, translation, and data annotation. Find projects that match your skills, languages, and interests.')}
            </p>
            <div className="row hero-ctas">
              <Button to="/opportunities" size="lg" iconRight="arrowRight">
                {t('Explore Opportunities')}
              </Button>
              <Button to="/signup" size="lg" variant="secondary">
                {t('Join as a Contributor')}
              </Button>
            </div>
            <ul className="hero-points">
              <li><Icon name="check" /> {t('Free to join')}</li>
              <li><Icon name="check" /> {t('Remote, flexible work')}</li>
              <li><Icon name="check" /> {t('Requirements shown up front')}</li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="values" aria-label={t('Platform overview')}>
        <div className="container values-grid">
          {VALUES.map((v) => (
            <div className="value" key={v.title}>
              <span className="icon-tile sm">
                <Icon name={v.icon} />
              </span>
              <div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="categories" aria-labelledby="cat-h">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('Job categories')}</span>
            <h2 id="cat-h">{t('Work that matches how you contribute')}</h2>
            <p>{t('Six kinds of projects, each with its own tools, requirements and skill levels.')}</p>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <article className="cat-card" key={c.id}>
                <span className="cat-icon">
                  <Icon name={c.icon} />
                </span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="cat-foot">
                  <Link to={`/opportunities?category=${c.id}`} className="link-btn" aria-label={t('Explore {name} jobs', { name: c.name })}>
                    {t('Explore Jobs')} <Icon name="arrowRight" />
                  </Link>
                  <span className="xs subtle">{t('{n} sample listings', { n: counts[c.id] })}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-navy" id="how-it-works" aria-labelledby="how-h">
        <div className="container">
          <div className="section-head light">
            <span className="eyebrow">{t('How it works')}</span>
            <h2 id="how-h">{t('From sign-up to your first project')}</h2>
            <p>{t('A clear, four-step path. You always know what comes next.')}</p>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="feat-h">
        <div className="container">
          <div className="section-head row-between" style={{ alignItems: 'flex-end' }}>
            <div>
              <span className="eyebrow">{t('Featured opportunities')}</span>
              <h2 id="feat-h">{t('A look at current projects')}</h2>
              <p>
                {t('Example listings that show how opportunities are presented.')} <SampleBadge>{t('Sample data — not real listings')}</SampleBadge>
              </p>
            </div>
            <Button to="/opportunities" variant="secondary" iconRight="arrowRight">
              {t('View all opportunities')}
            </Button>
          </div>
          <div className="job-grid two">
            {featured.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-subtle" aria-labelledby="why-h">
        <div className="container why-grid">
          <div>
            <span className="eyebrow">{t('Why VERALINK')}</span>
            <h2 id="why-h" className="section-title">{t('Designed around clarity, not guesswork')}</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: 520 }}>
              {t('Contributors should understand exactly what a project needs, how it works and where their application stands.')}
            </p>
            <div className="why-list">
              {WHY.map((w) => (
                <div className="why-item" key={w.title}>
                  <span className="icon-tile sm sand">
                    <Icon name={w.icon} />
                  </span>
                  <div>
                    <h3>{w.title}</h3>
                    <p>{w.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="section" id="faq" aria-labelledby="faq-h">
        <div className="container faq-grid">
          <div>
            <span className="eyebrow">{t('FAQ')}</span>
            <h2 id="faq-h" className="section-title">{t('Questions, answered')}</h2>
            <p className="muted" style={{ marginTop: 12 }}>
              {tx('Can’t find what you need? Visit the {link}.', { link: <Link to="/page/help">{t('Help Center')}</Link> })}
            </p>
          </div>
          <Accordion items={LANDING_FAQ} />
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <div className="final-card">
            <div>
              <h2>{t('Ready to put your skills to work?')}</h2>
              <p>{t('Create a free account, build your profile and start exploring opportunities in your languages.')}</p>
            </div>
            <div className="row">
              <Button to="/signup" variant="light" size="lg" iconRight="arrowRight">
                {t('Create your account')}
              </Button>
              <Button to="/opportunities" variant="outline-light" size="lg">
                {t('Browse opportunities')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
