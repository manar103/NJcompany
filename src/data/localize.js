// Display-language view of stored content. Opportunities are stored in English (the source
// language); their text fields are translated through the i18n dictionary when shown.
// Language names, ids and enum values stay untouched because filters and logic rely on them.
import { t } from '../i18n';

const L = (s) => (typeof s === 'string' ? t(s) : s);
const list = (arr) => (Array.isArray(arr) ? arr.map(L) : arr);

export function localizeJob(j) {
  return {
    ...j,
    title: L(j.title),
    summary: L(j.summary),
    overview: L(j.overview),
    commitment: L(j.commitment),
    responsibilities: list(j.responsibilities),
    mandatory: list(j.mandatory),
    preferred: list(j.preferred),
    equipment: list(j.equipment),
    steps: list(j.steps),
    faqs: j.faqs?.map((f) => ({ q: L(f.q), a: L(f.a) })),
    languages: j.languages?.map((l) => (l.note ? { ...l, note: L(l.note) } : l)),
    compensation: j.compensation && { ...j.compensation, details: L(j.compensation.details) },
    assessment: j.assessment?.required ? { ...j.assessment, name: L(j.assessment.name), duration: L(j.assessment.duration) } : j.assessment,
  };
}
