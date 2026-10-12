// Project workspaces — one per task type, sharing a common task footer.
import { useRef, useState } from 'react';
import { projects as projectsApi } from '../../services/api';
import { AUDIO_PROMPTS, ANNOTATION_LABELS, COLLECTION_SHOTS, EVALUATION_ITEM, TRANSCRIPTION_CLIP, TRANSLATION_SEGMENTS } from '../../data/tasks';
import { Alert, Badge, Button, Checkbox, Field, Icon, IconButton, Textarea, useToast } from '../ui';
import Recorder, { SpeakButton } from './Recorder';
import { t } from '../../i18n';

/** Draft state persisted per project/task so work survives reloads (save-and-continue). */
function useTaskDraft(key, initial) {
  const [value, setValue] = useState(() => projectsApi.loadDraft(key)?.value ?? initial);
  const [savedAt, setSavedAt] = useState(() => projectsApi.loadDraft(key)?.savedAt || null);
  const update = (v) => {
    const next = typeof v === 'function' ? v(value) : v;
    setValue(next);
    projectsApi.saveDraft(key, { value: next });
    setSavedAt(new Date().toISOString());
  };
  return [value, update, savedAt];
}

function TaskFooter({ project, taskKey, canSubmit, reason, onDone }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async () => {
    setBusy(true);
    await projectsApi.completeTask(project.id, taskKey);
    setBusy(false);
    toast(t('Task submitted for quality review.'));
    onDone?.();
  };
  return (
    <div className="task-foot">
      <span className="xs subtle">
        <Icon name="save" size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('Drafts save automatically on this device')}
      </span>
      <div className="row">
        {!canSubmit && reason && <span className="xs subtle">{reason}</span>}
        <Button iconRight="send" disabled={!canSubmit} loading={busy} onClick={submit}>
          {t('Submit task')}
        </Button>
      </div>
    </div>
  );
}

function Panel({ title, icon, children, aside }) {
  return (
    <section className="card ws-panel">
      <div className="card-header">
        <h2>
          {icon && <Icon name={icon} size={18} style={{ display: 'inline', verticalAlign: '-3px', marginInlineEnd: 8, color: 'var(--steel)' }} />}
          {title}
        </h2>
        {aside}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

/* ---------------- Audio recording ---------------- */
export function AudioWorkspace({ project }) {
  const [i, setI] = useState(project.done % AUDIO_PROMPTS.length);
  const [recorded, setRecorded] = useState(false);
  const prompt = AUDIO_PROMPTS[i];
  return (
    <div className="ws-grid">
      <Panel title={t('Recording instructions')} icon="info">
        <ul className="jd-list">
          <li><Icon name="check" />{t('Find a quiet room; switch off fans and notifications.')}</li>
          <li><Icon name="check" />{t('Keep the microphone about a hand’s width from your mouth.')}</li>
          <li><Icon name="check" />{t('Leave half a second of silence before and after speaking.')}</li>
          <li><Icon name="check" />{t('Re-record if you hear background noise or stumble.')}</li>
        </ul>
      </Panel>
      <Panel title={t('Prompt {n} of {total}', { n: project.done + 1, total: project.total })} icon="mic" aside={<Badge tone="sand">{t(prompt.type)}</Badge>}>
        <blockquote className="sample-quote" dir="auto">{prompt.text}</blockquote>
        <p className="xs subtle" style={{ margin: '8px 0 16px' }}>{t(prompt.hint)}</p>
        <Recorder key={prompt.id + project.done} onRecorded={() => setRecorded(true)} />
        <TaskFooter project={project} taskKey={`audio:${project.id}`} canSubmit={recorded} reason={t('Record the prompt to submit')} onDone={() => { setRecorded(false); setI((x) => (x + 1) % AUDIO_PROMPTS.length); }} />
      </Panel>
    </div>
  );
}

/* ---------------- Transcription ---------------- */
export function TranscriptionWorkspace({ project }) {
  const key = `tx:${project.id}`;
  const [text, setText, savedAt] = useTaskDraft(key, '');
  const ref = useRef(null);
  const insert = (tag) => {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const next = text.slice(0, start) + tag + ' ' + text.slice(el?.selectionEnd ?? start);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
    });
  };
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="ws-grid">
      <Panel title={t('Audio')} icon="headphones" aside={<span className="xs subtle">{t('Clip {id} · {n} speakers', { id: TRANSCRIPTION_CLIP.id, n: TRANSCRIPTION_CLIP.speakers })}</span>}>
        <div className="fake-wave" aria-hidden="true">
          {Array.from({ length: 64 }).map((_, k) => <span key={k} style={{ height: `${18 + Math.abs(Math.sin(k * 0.7) * 40 + Math.cos(k * 1.9) * 16)}%` }} />)}
        </div>
        <SpeakButton text={TRANSCRIPTION_CLIP.speech} />
        <p className="xs subtle" style={{ marginTop: 10 }}>{t('The sample clip is read by your browser’s text-to-speech.')}</p>
        <h3 className="h-card" style={{ margin: '20px 0 8px' }}>{t('Style guide highlights')}</h3>
        <ul className="jd-list small">
          <li><Icon name="check" />{t('Transcribe verbatim, including fillers.')}</li>
          <li><Icon name="check" />{t('Start each turn with a speaker label.')}</li>
          <li><Icon name="check" />{t('Use [inaudible] for words you cannot hear.')}</li>
        </ul>
      </Panel>
      <Panel title={t('Transcript')} icon="edit" aside={<span className="xs subtle">{savedAt ? t('Draft saved') : t('Not saved yet')}</span>}>
        <div className="tag-bar" role="toolbar" aria-label={t('Insert tag')}>
          {TRANSCRIPTION_CLIP.tags.map((tag) => (
            <button key={tag} type="button" className="tag-toggle" onClick={() => insert(tag)}>{tag}</button>
          ))}
        </div>
        <label htmlFor="tx" className="sr-only">{t('Transcript')}</label>
        <textarea id="tx" ref={ref} className="textarea editor" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Speaker 1: …')} />
        <div className="row-between xs subtle" style={{ marginTop: 6 }}>
          <span>{t('{n} words', { n: words })}</span>
          <span>{t('Tip: use the tag buttons to keep formatting consistent.')}</span>
        </div>
        <TaskFooter project={project} taskKey={key} canSubmit={words >= 5} reason={t('Write at least 5 words')} onDone={() => setText('')} />
      </Panel>
    </div>
  );
}

/* ---------------- Translation ---------------- */
export function TranslationWorkspace({ project, job }) {
  const key = `tr:${project.id}`;
  const [values, setValues, savedAt] = useTaskDraft(key, {});
  const target = t(job.languages[0]?.name || 'Target');
  const over = TRANSLATION_SEGMENTS.filter((s) => (values[s.id] || '').length > s.limit);
  const placeholdersBroken = TRANSLATION_SEGMENTS.filter((s) => {
    const ph = s.source.match(/\{\w+\}/g) || [];
    return values[s.id] && ph.some((p) => !values[s.id].includes(p));
  });
  const complete = TRANSLATION_SEGMENTS.every((s) => (values[s.id] || '').trim());
  return (
    <Panel
      title={t('Translate segments')}
      icon="translate"
      aside={
        <div className="row" style={{ gap: 8 }}>
          <Badge tone="outline">{t('English')} → {target}</Badge>
          <span className="xs subtle">{savedAt ? t('Draft saved') : ''}</span>
        </div>
      }
    >
      <div className="seg-list">
        {TRANSLATION_SEGMENTS.map((s, i) => {
          const v = values[s.id] || '';
          return (
            <div className="seg" key={s.id}>
              <div className="seg-src">
                <span className="seg-num">{i + 1}</span>
                <div>
                  <p lang="en">{s.source}</p>
                  <span className="xs subtle">{t(s.context)}</span>
                </div>
              </div>
              <div className="seg-tgt">
                <label className="sr-only" htmlFor={`seg-${s.id}`}>{t('Translation for segment {n}', { n: i + 1 })}</label>
                <textarea id={`seg-${s.id}`} dir="auto" className="textarea" rows={2} value={v} onChange={(e) => setValues({ ...values, [s.id]: e.target.value })} aria-invalid={v.length > s.limit || undefined} />
                <span className={`xs ${v.length > s.limit ? 'text-danger' : 'subtle'}`}>{t('{n}/{limit} characters', { n: v.length, limit: s.limit })}</span>
              </div>
            </div>
          );
        })}
      </div>
      {placeholdersBroken.length > 0 && <Alert tone="warning">{t('Keep placeholders such as {example} unchanged in segment {list}.', { example: '{name}', list: placeholdersBroken.map((s) => TRANSLATION_SEGMENTS.indexOf(s) + 1).join(', ') })}</Alert>}
      <TaskFooter
        project={project}
        taskKey={key}
        canSubmit={complete && !over.length && !placeholdersBroken.length}
        reason={!complete ? t('Translate every segment') : over.length ? t('Shorten segments over the limit') : t('Fix placeholders')}
        onDone={() => setValues({})}
      />
    </Panel>
  );
}

/* ---------------- Image annotation ---------------- */
function StreetScene() {
  return (
    <g>
      <rect width="640" height="400" fill="#C9D3DF" />
      <rect y="250" width="640" height="150" fill="#6F7884" />
      <rect y="240" width="640" height="12" fill="#A9B0B8" />
      {[60, 180, 300, 420, 540].map((x) => <rect key={x} x={x} y="320" width="60" height="6" fill="#E9E5D8" />)}
      <rect x="20" y="70" width="150" height="172" fill="#8C99A9" />
      <rect x="190" y="30" width="110" height="212" fill="#7C889A" />
      <rect x="470" y="60" width="160" height="182" fill="#93A0AF" />
      {[[40, 95], [90, 95], [40, 150], [90, 150], [210, 60], [250, 60], [210, 120], [250, 120], [490, 90], [550, 90]].map(([x, y]) => <rect key={x + '-' + y} x={x} y={y} width="30" height="36" fill="#B9C4D0" />)}
      <g><rect x="80" y="262" width="150" height="54" rx="12" fill="#1B263B" /><rect x="105" y="240" width="92" height="34" rx="10" fill="#243149" /><circle cx="115" cy="318" r="14" fill="#222" /><circle cx="200" cy="318" r="14" fill="#222" /></g>
      <g><rect x="380" y="275" width="170" height="58" rx="12" fill="#B5651D" /><rect x="410" y="252" width="100" height="34" rx="10" fill="#9A541A" /><circle cx="415" cy="336" r="15" fill="#222" /><circle cx="515" cy="336" r="15" fill="#222" /></g>
      <g><circle cx="330" cy="208" r="10" fill="#5A4636" /><rect x="320" y="220" width="20" height="44" rx="8" fill="#2F6F4F" /><rect x="322" y="262" width="7" height="30" fill="#333" /><rect x="331" y="262" width="7" height="30" fill="#333" /></g>
      <g><rect x="598" y="150" width="5" height="100" fill="#555" /><circle cx="600" cy="142" r="16" fill="#C0392B" /><circle cx="600" cy="142" r="11" fill="#fff" /></g>
    </g>
  );
}

export function AnnotationWorkspace({ project }) {
  const key = `an:${project.id}`;
  const [boxes, setBoxes] = useTaskDraft(key, []);
  const [label, setLabel] = useState(ANNOTATION_LABELS[0].id);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);
  const toLocal = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 640, y: ((e.clientY - r.top) / r.height) * 400 };
  };
  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toLocal(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onMove = (e) => drag && setDrag({ ...drag, ...((p) => ({ x1: p.x, y1: p.y }))(toLocal(e)) });
  const onUp = () => {
    if (!drag) return;
    const b = { x: Math.min(drag.x0, drag.x1), y: Math.min(drag.y0, drag.y1), w: Math.abs(drag.x1 - drag.x0), h: Math.abs(drag.y1 - drag.y0) };
    if (b.w > 8 && b.h > 8) setBoxes([...boxes, { id: Date.now(), label, ...b }]);
    setDrag(null);
  };
  const color = (id) => ANNOTATION_LABELS.find((l) => l.id === id)?.color;
  return (
    <div className="ws-grid wide">
      <Panel title={t('Image {n} of {total}', { n: project.done + 1, total: project.total })} icon="image" aside={<span className="xs subtle">{t('Drag on the image to draw a box')}</span>}>
        <div className="label-bar" role="radiogroup" aria-label={t('Active label')}>
          {ANNOTATION_LABELS.map((l) => (
            <label key={l.id} className="label-pick" style={{ '--c': l.color }}>
              <input type="radio" name="label" checked={label === l.id} onChange={() => setLabel(l.id)} />
              <span><i />{t(l.label)}</span>
            </label>
          ))}
        </div>
        <svg
          ref={svgRef}
          className="anno-canvas"
          viewBox="0 0 640 400"
          role="img"
          aria-label={t('Sample street scene for annotation. Draw boxes with a mouse or trackpad.')}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <StreetScene />
          {boxes.map((b) => (
            <g key={b.id}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke={color(b.label)} strokeWidth="3" />
              <rect x={b.x} y={b.y - 18} width={ANNOTATION_LABELS.find((l) => l.id === b.label).label.length * 7 + 12} height="18" fill={color(b.label)} />
              <text x={b.x + 6} y={b.y - 5} fill="#fff" fontSize="12" fontFamily="Inter, sans-serif">{ANNOTATION_LABELS.find((l) => l.id === b.label).label}</text>
            </g>
          ))}
          {drag && <rect x={Math.min(drag.x0, drag.x1)} y={Math.min(drag.y0, drag.y1)} width={Math.abs(drag.x1 - drag.x0)} height={Math.abs(drag.y1 - drag.y0)} fill="rgba(221,190,169,0.25)" stroke={color(label)} strokeWidth="2" strokeDasharray="6 4" />}
        </svg>
        <p className="xs subtle" style={{ marginTop: 8 }}>{t('Sample illustration — not real project data.')}</p>
      </Panel>
      <Panel title={t('Annotations')} icon="box" aside={<Badge tone="outline">{t('Review: not submitted')}</Badge>}>
        {boxes.length === 0 ? (
          <p className="small subtle">{t('No boxes yet. Select a label and drag on the image.')}</p>
        ) : (
          <ul className="anno-list">
            {boxes.map((b, i) => (
              <li key={b.id}>
                <i style={{ background: color(b.label) }} />
                <span className="grow small">{i + 1}. {t(ANNOTATION_LABELS.find((l) => l.id === b.label).label)}</span>
                <span className="xs subtle">{Math.round(b.w)}×{Math.round(b.h)}</span>
                <IconButton icon="trash" label={t('Delete annotation {n}', { n: i + 1 })} onClick={() => setBoxes(boxes.filter((x) => x.id !== b.id))} />
              </li>
            ))}
          </ul>
        )}
        <div className="divider" style={{ margin: '16px 0' }} />
        <h3 className="h-card" style={{ marginBottom: 8 }}>{t('Checklist')}</h3>
        <ul className="jd-list small">
          <li><Icon name="check" />{t('Boxes are tight to visible pixels')}</li>
          <li><Icon name="check" />{t('Every vehicle, pedestrian and sign is labeled')}</li>
          <li><Icon name="check" />{t('Unclear images are flagged, not guessed')}</li>
        </ul>
        <TaskFooter project={project} taskKey={key} canSubmit={boxes.length > 0} reason={t('Add at least one box')} onDone={() => setBoxes([])} />
      </Panel>
    </div>
  );
}

/* ---------------- AI response evaluation ---------------- */
export function EvaluationWorkspace({ project }) {
  const key = `ev:${project.id}`;
  const [v, setV] = useTaskDraft(key, { pick: '', why: '', flags: [] });
  const [showEn, setShowEn] = useState(false);
  const E = EVALUATION_ITEM;
  return (
    <div className="stack">
      <Panel title={t('User request')} icon="file" aside={<button type="button" className="link-btn small" onClick={() => setShowEn((s) => !s)}>{showEn ? t('Hide English reference') : t('Show English reference')}</button>}>
        <p dir="rtl" lang="ar" className="eval-text">{E.prompt}</p>
        {showEn && <p className="small subtle">{E.promptEn}</p>}
      </Panel>
      <div className="ws-grid">
        {['a', 'b'].map((k) => (
          <Panel key={k} title={t('Response {k}', { k: k.toUpperCase() })} icon="sparkle">
            <p dir="rtl" lang="ar" className="eval-text">{E[k]}</p>
            {showEn && <p className="small subtle">{E[k + 'En']}</p>}
          </Panel>
        ))}
      </div>
      <Panel title={t('Your rating')} icon="scale">
        <fieldset>
          <legend className="field-label" style={{ marginBottom: 8 }}>{t('Which response is better overall?')}</legend>
          <div className="radio-cards">
            {[['a', 'Response A'], ['b', 'Response B'], ['same', 'About the same']].map(([val, l]) => (
              <label key={val} className="radio-card">
                <input type="radio" name="pick" checked={v.pick === val} onChange={() => setV({ ...v, pick: val })} />
                <strong>{t(l)}</strong>
              </label>
            ))}
          </div>
        </fieldset>
        <div style={{ marginTop: 16 }}>
          <Field label={t('Justification')} hint={t('2–4 sentences. Mention accuracy, completeness and tone.')}>
            <Textarea value={v.why} onChange={(e) => setV({ ...v, why: e.target.value })} />
          </Field>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          {['Factual error', 'Unsafe content', 'Poor fluency'].map((f) => (
            <Checkbox key={f} label={t('Flag: {name}', { name: t(f) })} checked={v.flags.includes(f)} onChange={() => setV({ ...v, flags: v.flags.includes(f) ? v.flags.filter((x) => x !== f) : [...v.flags, f] })} />
          ))}
        </div>
        <TaskFooter project={project} taskKey={key} canSubmit={!!v.pick && v.why.trim().length >= 30} reason={t('Pick a response and write 30+ characters')} onDone={() => setV({ pick: '', why: '', flags: [] })} />
      </Panel>
    </div>
  );
}

/* ---------------- Data collection ---------------- */
export function CollectionWorkspace() {
  return (
    <Panel title={t('Shot list')} icon="image">
      <ul className="jd-list">
        {COLLECTION_SHOTS.map((s) => <li key={s}><Icon name="image" />{t(s)}</li>)}
      </ul>
      <Alert tone="sand" title={t('Uploads are coming soon')}>
        {t('Photo upload needs secure file storage. Each shot will get an upload slot with automatic checks for blur, faces and personal information.')}
      </Alert>
    </Panel>
  );
}

export const WORKSPACES = {
  audio: AudioWorkspace,
  transcription: TranscriptionWorkspace,
  translation: TranslationWorkspace,
  annotation: AnnotationWorkspace,
  evaluation: EvaluationWorkspace,
  collection: CollectionWorkspace,
};
