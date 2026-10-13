// Listing defaults, assessment templates and FAQ content.
// Text stays in English here; it is translated for display (see data/localize.js and i18n/ar.js).
import { t, translated } from '../i18n';

export { withJobDefaults } from './jobDefaults';

export const ASSESSMENTS = {
  'as-audio': {
    id: 'as-audio',
    name: 'Audio quality check',
    category: 'voice',
    duration: '10 min',
    intro: 'Confirm your microphone and environment meet recording standards, and show you can follow a short script.',
    questions: [
      { id: 'q1', type: 'choice', prompt: 'Which environment is best for a recording session?', options: ['A café with soft music', 'A small room with the door closed and no fan running', 'Outdoors on a calm day', 'A kitchen while cooking'] },
      { id: 'q2', type: 'choice', prompt: 'You hear a car horn halfway through a clip. What should you do?', options: ['Keep going — it is only brief', 'Submit and leave a note', 'Re-record the clip', 'Lower your voice'] },
      { id: 'q3', type: 'mic', prompt: 'Microphone check: record yourself reading the sentence below, then play it back to confirm it sounds clear.', sample: '“The quick morning train arrives at seven fifteen.”' },
      { id: 'q4', type: 'text', prompt: 'Briefly describe where you would record and what equipment you will use.' },
    ],
  },
  'as-transcription': {
    id: 'as-transcription',
    name: 'Transcription accuracy test',
    category: 'transcription',
    duration: '25 min',
    intro: 'Show that you can apply a style guide consistently. Read each question carefully; accuracy matters more than speed.',
    questions: [
      { id: 'q1', type: 'choice', prompt: 'According to standard verbatim guidelines, how should a filler like “um” be handled?', options: ['Always removed', 'Kept exactly as spoken', 'Replaced with “...”', 'Written in capitals'] },
      { id: 'q2', type: 'choice', prompt: 'A word is impossible to hear clearly. What tag should you use?', options: ['[guess]', '[inaudible]', '[noise]', 'Leave it blank'] },
      { id: 'q3', type: 'listen', prompt: 'Listen to the sample using your browser’s text-to-speech, then transcribe it exactly.', sample: 'Please take two tablets after breakfast, and call us if the headache continues past Thursday.' },
      { id: 'q4', type: 'text', prompt: 'In one or two sentences, explain how you would handle overlapping speakers.' },
    ],
  },
  'as-translation': {
    id: 'as-translation',
    name: 'Translation sample',
    category: 'translation',
    duration: '30 min',
    intro: 'Translate the passages below into your target language. Aim for natural, fluent output rather than word-for-word translation.',
    questions: [
      { id: 'q1', type: 'choice', prompt: 'A source sentence uses an idiom with no direct equivalent. What is the best approach?', options: ['Translate it literally', 'Use an equivalent idiom or plain meaning', 'Leave it in English', 'Skip the sentence'] },
      { id: 'q2', type: 'translate', prompt: 'Translate into your target language:', sample: 'Could you remind me to water the plants before I leave for the weekend?' },
      { id: 'q3', type: 'translate', prompt: 'Translate into your target language:', sample: 'The store opens at 9 a.m., but the pharmacy counter opens an hour later.' },
    ],
  },
  'as-annotation': {
    id: 'as-annotation',
    name: 'Labeling guideline quiz',
    category: 'annotation',
    duration: '15 min',
    intro: 'Check your understanding of the labeling guidelines before working with real tasks.',
    questions: [
      { id: 'q1', type: 'choice', prompt: 'How tight should a bounding box be?', options: ['Loose, with generous margins', 'As tight as possible around visible pixels', 'Covering the whole image', 'Only around the center'] },
      { id: 'q2', type: 'choice', prompt: 'A pedestrian is 70% hidden behind a car. What should you do?', options: ['Skip them', 'Box only the visible part and mark “occluded”', 'Guess the full body', 'Label them as a car'] },
      { id: 'q3', type: 'choice', prompt: 'An image contains a readable license plate. What is the correct action?', options: ['Label it normally', 'Flag the image per privacy guidelines', 'Crop it out yourself', 'Ignore it'] },
    ],
  },
  'as-evaluation': {
    id: 'as-evaluation',
    name: 'Evaluation reasoning test',
    category: 'evaluation',
    duration: '35 min',
    intro: 'Compare responses and explain your reasoning clearly. There is no time pressure per question.',
    questions: [
      { id: 'q1', type: 'choice', prompt: 'Response A is friendly but contains one factual error. Response B is accurate but brief. Which is generally preferred?', options: ['Response A', 'Response B', 'They are equal', 'Neither'] },
      { id: 'q2', type: 'text', prompt: 'A user asks for the boiling point of water at sea level. One response says 90 °C. Write a 2–3 sentence justification for your rating.' },
      { id: 'q3', type: 'choice', prompt: 'A response refuses a harmless cooking question. How should it be rated for helpfulness?', options: ['High', 'Medium', 'Low', 'Not applicable'] },
    ],
  },
};

export const LANDING_FAQ = translated([
  { q: 'How do I register?', a: 'Create an account with your email address, verify it, and complete a short profile with your languages, skills and availability. Registration is free.' },
  { q: 'Which languages are needed?', a: 'Each opportunity lists its required languages and proficiency levels. Many projects need native speakers of a specific language or dialect; others only require enough English to read guidelines.' },
  { q: 'Are there assessments?', a: 'Many projects include a short assessment to confirm the skills a task needs. Requirements, format and estimated duration are shown on every opportunity before you apply.' },
  { q: 'How do applications work?', a: 'Apply from any opportunity page. You can track every application in your dashboard and see its current status and next step. Applying does not guarantee acceptance.' },
  { q: 'How are payment terms communicated?', a: 'Each project shows its compensation type. The exact rate, payment schedule and conditions are set out in the project agreement you review before accepting any work.' },
  { q: 'Are projects always available?', a: 'Availability depends on client demand, language and region. Some projects close when enough contributors have joined, so new opportunities are listed regularly.' },
], 'q', 'a');

// Assessment text follows the UI language; `sample` passages stay as written (they are test material).
for (const a of Object.values(ASSESSMENTS)) {
  translated([a], 'name', 'duration', 'intro');
  for (const q of a.questions) {
    translated([q], 'prompt');
    if (q.options) {
      const en = q.options;
      Object.defineProperty(q, 'options', { get: () => en.map((o) => t(o)), enumerable: true });
    }
  }
}
