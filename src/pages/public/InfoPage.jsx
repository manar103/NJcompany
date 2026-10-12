import { useState } from 'react';
import { useDocumentTitle } from '../../lib/hooks';
import { LANDING_FAQ } from '../../data/jobs';
import { isEmail } from '../../lib/format';
import { Accordion, Alert, Button, Field, Input, Select, Textarea } from '../../components/ui';
import { t } from '../../i18n';

function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', topic: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = t('Enter your name.');
    if (!isEmail(f.email)) er.email = t('Enter a valid email address.');
    if (!f.topic) er.topic = t('Choose a topic.');
    if (f.message.trim().length < 20) er.message = t('Message must be at least 20 characters.');
    setErrors(er);
    if (!Object.keys(er).length) setSent(true);
  };
  if (sent)
    return (
      <Alert tone="success" title={t('Message received')}>
        {t('Thanks for reaching out. Our support team will reply by email.')}
      </Alert>
    );
  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field label={t('Name')} error={errors.name}>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
        </Field>
        <Field label={t('Email')} error={errors.email}>
          <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
        </Field>
        <Field label={t('Topic')} error={errors.topic} className="span-2">
          <Select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder={t('Select a topic')} options={['Account & login', 'Applications', 'Assessments', 'Payments', 'Partnerships', 'Other']} />
        </Field>
        <Field label={t('Message')} error={errors.message} className="span-2">
          <Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        </Field>
      </div>
      <Button type="submit" iconRight="send">
        {t('Send message')}
      </Button>
    </form>
  );
}

// Built on each render so the content follows the current language.
const pages = () => ({
  about: {
    title: t('About VERALINK'),
    lead: t('VERALINK connects people around the world with opportunities to contribute to how AI systems are built, evaluated and improved.'),
    body: (
      <>
        <p>{t('AI systems learn from human judgement, language and perspective. VERALINK exists to make that work accessible to skilled people in every region — with clear requirements, fair processes and transparent status updates.')}</p>
      </>
    ),
  },
  contact: { title: t('Contact us'), lead: t('Questions about your account, an application or a partnership? Send us a message.'), body: <ContactForm /> },
  help: { title: t('Help Center'), lead: t('Answers to common questions about accounts, applications and projects.'), body: <Accordion items={LANDING_FAQ} /> },
  privacy: {
    title: t('Privacy Policy'),
    lead: t('Placeholder — the final policy must be prepared and reviewed by qualified counsel.'),
    body: (
      <>
        <p>{t('The production privacy policy will describe what personal data VERALINK collects (such as account, profile and language information), why it is collected, how long it is kept, who it is shared with, and how contributors can access, correct, export or delete their data.')}</p>
      </>
    ),
  },
  terms: {
    title: t('Terms of Service'),
    lead: t('Placeholder — the final terms must be prepared and reviewed by qualified counsel.'),
    body: <p>{t('The production terms will cover eligibility, account responsibilities, project agreements, payment terms, intellectual property for submitted work, acceptable use and dispute resolution.')}</p>,
  },
});

export default function InfoPage({ slug }) {
  const page = pages()[slug] || { title: t('Page not found'), lead: t('The page you were looking for does not exist.'), body: <Button to="/">{t('Back to home')}</Button> };
  useDocumentTitle(page.title);
  return (
    <div className="info-page">
      <div className="container info-wrap">
        <span className="eyebrow">{t('VERALINK')}</span>
        <h1>{page.title}</h1>
        <p className="info-lead">{page.lead}</p>
        <div className="info-body">{page.body}</div>
      </div>
    </div>
  );
}
