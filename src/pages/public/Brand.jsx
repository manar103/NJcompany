import { useState } from 'react';
import { useDocumentTitle } from '../../lib/hooks';
import { APPLICATION_STATUSES } from '../../data/constants';
import {
  Alert, Badge, Button, Checkbox, Dialog, EmptyState, Field, Icon, Input, LogoMark, Logo, PasswordInput, Progress, Select,
  Skeleton, StatusBadge, Stepper, Switch, Tabs, useToast,
} from '../../components/ui';
import { t } from '../../i18n';

const COLORS = [
  { name: 'Deep Navy', hex: '#1B263B', role: 'Primary — headings, navigation, primary buttons', text: '#fff' },
  { name: 'Steel Blue', hex: '#415A77', role: 'Secondary — links, interactive states, progress', text: '#fff' },
  { name: 'Muted Blue Gray', hex: '#778DA9', role: 'Supporting graphics, icons, secondary UI', text: '#1B263B' },
  { name: 'Soft Gray', hex: '#E0E1DD', role: 'Borders, dividers, subtle surfaces', text: '#1B263B' },
  { name: 'Warm Sand', hex: '#DDBEA9', role: 'Restrained accent — highlights, active markers', text: '#1B263B' },
  { name: 'White', hex: '#FFFFFF', role: 'Page backgrounds and cards', text: '#1B263B' },
];

const PRINCIPLES = [
  { t: 'Trust through clarity', d: 'Requirements, status and next steps are always explicit. We never imply outcomes we cannot guarantee.' },
  { t: 'Human first, AI second', d: 'People and their languages lead the story; technology is the setting, not the hero.' },
  { t: 'Quietly global', d: 'Multilingual scripts and regions appear naturally — no stock globes or robot imagery.' },
  { t: 'Restraint', d: 'Navy and white carry the brand. Sand is a seasoning, used for a single highlight per view.' },
];

export default function Brand() {
  useDocumentTitle(t('Brand & Design System'));
  const [dialog, setDialog] = useState(false);
  const toast = useToast();
  return (
    <div className="brand-page">
      <section className="brand-hero">
        <div className="container">
          <span className="eyebrow">{t('Brand & design system')}</span>
          <h1>{t('VERALINK identity')}</h1>
          <p>
            A modern, trustworthy international technology brand that connects global talent with the work of improving AI. The identity is calm, precise and
            human — closer to a premium financial or travel product than a futuristic AI startup.
          </p>
        </div>
      </section>

      <div className="container brand-body">
        <section className="brand-section">
          <h2>{t('1 · Brand direction')}</h2>
          <div className="principles">
            {PRINCIPLES.map((p) => (
              <div className="card card-pad" key={p.t}>
                <h3>{p.t}</h3>
                <p className="small muted" style={{ marginTop: 8 }}>{p.d}</p>
              </div>
            ))}
          </div>
          <p className="muted brand-note">
            <strong>{t('Voice:')}</strong> plain, direct and respectful. Short sentences. Say exactly what happens next (“Your application will be reviewed after you complete the assessment”), never
            hype (“Earn big with AI!”).
          </p>
        </section>

        <section className="brand-section">
          <h2>{t('2 · Logo')}</h2>
          <div className="logo-grid">
            <div className="logo-tile">
              <LogoMark size={120} />
              <span>{t('Primary mark')}</span>
            </div>
            <div className="logo-tile navy">
              <Logo light size={44} />
              <span>{t('Lockup on navy')}</span>
            </div>
            <div className="logo-tile">
              <Logo size={44} />
              <span>{t('Lockup on white')}</span>
            </div>
            <div className="logo-tile">
              <div className="row" style={{ gap: 18, alignItems: 'flex-end' }}>
                <LogoMark size={48} />
                <LogoMark size={32} />
                <LogoMark size={20} />
                <LogoMark size={16} />
              </div>
              <span>{t('Scales to favicon (16px)')}</span>
            </div>
          </div>
          <div className="logo-anatomy card card-pad">
            <h3>{t('Concept')}</h3>
            <p className="small muted">
              Two arms — one white for <em>{t('human talent')}</em>, one blue-gray for <em>{t('AI systems')}</em> — begin as open network nodes and converge into a <strong>V</strong>. They meet at a
              single warm-sand node: the point where a person’s skill becomes a contribution. The open nodes also read as speech bubbles or links, nodding to language and connection,
              without robot heads or neural-network clichés. Built from three primitives (line, ring, dot) so it stays crisp at 16px.
            </p>
            <ul className="small muted" style={{ marginTop: 12, paddingLeft: 18 }}>
              <li>{t('Minimum size: 16px (mark), 96px wide (lockup).')}</li>
              <li>{t('Clear space: the diameter of one node on every side.')}</li>
              <li>{t('Wordmark: Inter Bold, uppercase, +0.14em tracking.')}</li>
            </ul>
          </div>
        </section>

        <section className="brand-section">
          <h2>{t('3 · Color')}</h2>
          <div className="swatches">
            {COLORS.map((c) => (
              <div className="swatch" key={c.hex}>
                <div className="swatch-color" style={{ background: c.hex, color: c.text }}>
                  {c.hex}
                </div>
                <div className="swatch-info">
                  <strong>{c.name}</strong>
                  <span>{c.role}</span>
                </div>
              </div>
            ))}
          </div>
          <Alert tone="info" title={t('Accessibility')}>
            Body text uses Deep Navy (15.6:1 on white) or derived slate tones ≥ 5.3:1. Warm Sand and Muted Blue Gray are never used for text on white; they are reserved for
            fills, icons and decorative accents. Status colors are always paired with a text label.
          </Alert>
        </section>

        <section className="brand-section">
          <h2>{t('4 · Typography')}</h2>
          <div className="type-scale card card-pad">
            <div><span className="type-tag">{t('Display · 52/600')}</span><p style={{ fontSize: 'var(--fs-4xl)', fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{t('Connect Talent.')}</p></div>
            <div><span className="type-tag">H1 · 36/650</span><p style={{ fontSize: 'var(--fs-3xl)', fontWeight: 650 }}>{t('Find opportunities')}</p></div>
            <div><span className="type-tag">H2 · 28/650</span><p style={{ fontSize: 'var(--fs-2xl)', fontWeight: 650 }}>{t('Recommended for you')}</p></div>
            <div><span className="type-tag">H3 · 18/650</span><p style={{ fontSize: 'var(--fs-lg)', fontWeight: 650 }}>{t('Medical Conversation Transcription')}</p></div>
            <div><span className="type-tag">{t('Body · 16/400')}</span><p>{t('Discover global opportunities in AI training and data annotation.')}</p></div>
            <div><span className="type-tag">{t('Small · 14/400')}</span><p className="small muted">{t('Applying does not guarantee acceptance.')}</p></div>
          </div>
        </section>

        <section className="brand-section">
          <h2>{t('5 · Components')}</h2>
          <div className="comp-grid">
            <div className="card card-pad stack">
              <h3>{t('Buttons')}</h3>
              <div className="row">
                <Button>{t('Primary')}</Button>
                <Button variant="secondary">{t('Secondary')}</Button>
                <Button variant="steel">{t('Steel')}</Button>
                <Button variant="ghost">{t('Ghost')}</Button>
              </div>
              <div className="row">
                <Button size="sm" icon="plus">{t('Small')}</Button>
                <Button loading>{t('Saving')}</Button>
                <Button disabled>{t('Disabled')}</Button>
                <Button variant="danger" icon="trash">{t('Withdraw')}</Button>
              </div>
            </div>
            <div className="card card-pad stack">
              <h3>{t('Application statuses')}</h3>
              <div className="row">
                {APPLICATION_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} />
                ))}
              </div>
              <h3 style={{ marginTop: 16 }}>{t('Badges')}</h3>
              <div className="row">
                <Badge>{t('Neutral')}</Badge>
                <Badge tone="steel">{t('Steel')}</Badge>
                <Badge tone="sand">{t('Assessment')}</Badge>
                <Badge tone="outline">{t('Entry level')}</Badge>
                <Badge tone="sample">{t('Sample data')}</Badge>
              </div>
            </div>
            <div className="card card-pad stack">
              <h3>{t('Form controls')}</h3>
              <Field label={t('Email')} hint={t('We’ll never share your email.')}>
                <Input type="email" placeholder={t('you@example.com')} />
              </Field>
              <Field label={t('Password')} error={t('Password must include a number.')}>
                <PasswordInput defaultValue="password" />
              </Field>
              <Field label={t('Country')}>
                <Select options={['Egypt', 'Kenya', 'Brazil']} placeholder={t('Select a country')} />
              </Field>
              <Checkbox label={t('I agree to the terms')} defaultChecked />
              <Switch label={t('Email notifications')} description={t('Status changes and deadlines')} defaultChecked />
            </div>
            <div className="card card-pad stack">
              <h3>{t('Feedback')}</h3>
              <Alert tone="success" title={t('Profile saved')}>{t('Your changes were saved.')}</Alert>
              <Alert tone="warning" title={t('Assessment required')}>{t('Complete it to continue.')}</Alert>
              <Alert tone="danger">{t('We couldn’t load this content.')}</Alert>
              <Progress value={64} label={t('Example progress')} />
              <Stepper steps={['Account', 'Languages', 'Skills', 'Availability']} current={1} />
              <div className="row">
                <Button variant="secondary" size="sm" onClick={() => setDialog(true)}>{t('Open dialog')}</Button>
                <Button variant="secondary" size="sm" onClick={() => toast('This is a toast notification')}>{t('Show toast')}</Button>
              </div>
            </div>
            <div className="card stack" style={{ gridColumn: '1 / -1' }}>
              <div className="card-pad" style={{ paddingBottom: 0 }}>
                <h3>{t('Tabs, loading and empty states')}</h3>
              </div>
              <div className="card-pad" style={{ paddingTop: 0 }}>
                <Tabs
                  label={t('Example tabs')}
                  tabs={[
                    { id: 'a', label: 'Loading', content: <div className="stack-sm"><Skeleton w="40%" h={18} /><Skeleton /><Skeleton w="80%" /></div> },
                    { id: 'b', label: 'Empty', count: 0, content: <EmptyState icon="clipboard" title={t('No applications yet')}>{t('When you apply to an opportunity, it will appear here.')}</EmptyState> },
                    { id: 'c', label: 'Icons', content: <div className="icon-row">{['mic', 'transcript', 'translate', 'box', 'database', 'scale', 'globe', 'shield', 'route', 'target', 'bell', 'clipboard'].map((i) => <span className="icon-tile sm" key={i} title={i}><Icon name={i} /></span>)}</div> },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="brand-section">
          <h2>{t('6 · Spacing, radius & elevation')}</h2>
          <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
            {[4, 8, 12, 16, 24, 32, 48, 64].map((s) => (
              <div key={s} className="space-demo">
                <span style={{ width: s, height: s }} />
                <small>{s}</small>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 16 }}>
            {t('4px base grid · radius 6 / 10 / 14 / 20 · cards use a 1px Soft Gray border with a barely-there shadow; elevation increases only for menus and dialogs.')}
          </p>
        </section>
      </div>

      <Dialog open={dialog} onClose={() => setDialog(false)} title={t('Withdraw application?')} description={t('You can apply again later if the project is still open.')} footer={<><Button variant="ghost" onClick={() => setDialog(false)}>{t('Cancel')}</Button><Button variant="danger" onClick={() => setDialog(false)}>{t('Withdraw')}</Button></>}>
        <p className="small muted">{t('Dialogs trap focus, close on Escape and restore focus to the trigger.')}</p>
      </Dialog>
    </div>
  );
}
