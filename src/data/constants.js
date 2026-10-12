// Shared enums. Keys mirror the shape a REST API (e.g. Django REST Framework choices) would return.
// Display fields (name, label, …) are getters that translate on access, so they follow the UI language.
import { translated } from '../i18n';

/** value -> label map whose labels follow the UI language. */
const labelMap = (list, pick = (l) => l) => new Proxy({}, { get: (_, k) => { const i = list.find((x) => x.value === k); return i && pick(i.label); } });

export const CATEGORIES = translated([
  {
    id: 'voice',
    name: 'Voice Recording & Audio Collection',
    short: 'Voice & Audio',
    icon: 'mic',
    description: 'Record scripted or natural speech in your native language and accent to help speech systems understand more people.',
  },
  {
    id: 'transcription',
    name: 'Transcription & Speech Annotation',
    short: 'Transcription',
    icon: 'transcript',
    description: 'Turn audio into accurate text and tag speakers, noise and intent following detailed style guides.',
  },
  {
    id: 'translation',
    name: 'Translation & Localization',
    short: 'Translation',
    icon: 'translate',
    description: 'Translate and adapt prompts, responses and interfaces so AI works naturally across cultures.',
  },
  {
    id: 'annotation',
    name: 'Image & Video Annotation',
    short: 'Image & Video',
    icon: 'box',
    description: 'Draw boxes, segment objects and label scenes so vision models learn to see accurately.',
  },
  {
    id: 'collection',
    name: 'Data Collection',
    short: 'Data Collection',
    icon: 'database',
    description: 'Capture photos, short videos or written samples that follow a project brief and privacy rules.',
  },
  {
    id: 'evaluation',
    name: 'AI Response Evaluation',
    short: 'AI Evaluation',
    icon: 'scale',
    description: 'Compare and rate model answers for accuracy, helpfulness and safety, and explain your reasoning.',
  },
], 'name', 'short', 'description');

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const LANGUAGES = [
  'English', 'Arabic', 'Spanish', 'French', 'German', 'Portuguese', 'Hindi', 'Bengali', 'Urdu',
  'Indonesian', 'Swahili', 'Yoruba', 'Turkish', 'Japanese', 'Korean', 'Mandarin Chinese', 'Vietnamese', 'Tagalog', 'Italian', 'Polish',
];

export const PROFICIENCY = translated([
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent (C1–C2)' },
  { value: 'professional', label: 'Professional (B2)' },
  { value: 'conversational', label: 'Conversational (B1)' },
], 'label');
export const proficiencyLabel = labelMap(PROFICIENCY, (l) => l.split(' (')[0]);

export const REGIONS = ['Global', 'Africa', 'Asia Pacific', 'Europe', 'Latin America', 'Middle East & North Africa', 'North America', 'South Asia'];

export const COUNTRIES = [
  'Argentina', 'Australia', 'Bangladesh', 'Brazil', 'Canada', 'Colombia', 'Egypt', 'France', 'Germany', 'Ghana', 'India',
  'Indonesia', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Mexico', 'Morocco', 'Nigeria', 'Pakistan', 'Philippines', 'Poland',
  'Portugal', 'Saudi Arabia', 'South Africa', 'South Korea', 'Spain', 'Tanzania', 'Tunisia', 'Turkey', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Vietnam', 'Other',
];

export const EXPERIENCE = translated([
  { value: 'entry', label: 'Entry level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert / Specialist' },
], 'label');
export const experienceLabel = labelMap(EXPERIENCE);

export const WORK_TYPES = translated([
  { value: 'one_time', label: 'One-time project' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'part_time', label: 'Part-time, flexible hours' },
], 'label');
export const workTypeLabel = labelMap(WORK_TYPES);

export const COMPENSATION_TYPES = translated([
  { value: 'per_task', label: 'Per task' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'fixed', label: 'Fixed per project' },
  { value: 'unspecified', label: 'Shared after assessment' },
], 'label');
export const compensationLabel = labelMap(COMPENSATION_TYPES);

export const STATUS_META = translated({
  draft: { label: 'Draft', next: 'Finish and submit your application' },
  submitted: { label: 'Submitted', next: 'No action needed — waiting for review' },
  under_review: { label: 'Under Review', next: 'No action needed — review in progress' },
  assessment_required: { label: 'Assessment Required', next: 'Complete the required assessment' },
  accepted: { label: 'Accepted', next: 'Open the project workspace' },
  rejected: { label: 'Rejected', next: 'Browse other opportunities' },
  withdrawn: { label: 'Withdrawn', next: 'No further action' },
}, 'label', 'next');
export const APPLICATION_STATUSES = Object.keys(STATUS_META);

export const SKILLS = [
  'Audio recording', 'Transcription', 'Proofreading', 'Translation', 'Localization', 'Image labeling',
  'Video annotation', 'Fact-checking', 'Writing', 'Research', 'Coding', 'Mathematics', 'Medical knowledge', 'Legal knowledge',
];

export const WORKLOAD = translated([
  { value: 'light', label: 'Light', hint: 'Under 10 hrs / week' },
  { value: 'moderate', label: 'Moderate', hint: '10–20 hrs / week' },
  { value: 'substantial', label: 'Substantial', hint: '20+ hrs / week' },
], 'label', 'hint');
