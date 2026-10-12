// SAMPLE task content for the project workspace mockups.

export const AUDIO_PROMPTS = [
  { id: 'a1', type: 'Scripted', text: 'اقرأ الجملة: «القطار هيوصل الساعة سبعة وربع الصبح.»', hint: 'Read naturally in your own dialect.' },
  { id: 'a2', type: 'Spontaneous', text: 'Describe, in Egyptian Arabic, how you usually spend a Friday. Aim for 20–40 seconds.', hint: 'Do not mention real names or addresses.' },
  { id: 'a3', type: 'Scripted', text: 'اقرأ: «ممكن تبعتلي العنوان على الواتساب؟»', hint: 'Keep a steady distance from the microphone.' },
];

export const TRANSCRIPTION_CLIP = {
  id: 'clip-0412',
  duration: '0:18',
  speakers: 2,
  // Read aloud with browser text-to-speech in place of a real project audio file.
  speech: 'Good morning. So, how long have you had the cough? About a week, maybe a little more. And any fever? Only at night, I think.',
  tags: ['[inaudible]', '[crosstalk]', '[noise]', 'Speaker 1:', 'Speaker 2:'],
};

export const TRANSLATION_SEGMENTS = [
  { id: 's1', source: 'Save changes', limit: 20, context: 'Button label' },
  { id: 's2', source: 'Your payment method was updated.', limit: 60, context: 'Success message' },
  { id: 's3', source: 'Hi {name}, you have {count} new messages.', limit: 80, context: 'Notification — keep {name} and {count} unchanged' },
  { id: 's4', source: 'Forgot your password? We can help you reset it.', limit: 90, context: 'Help text on login screen' },
];

export const ANNOTATION_LABELS = [
  { id: 'car', label: 'Vehicle', color: '#415A77' },
  { id: 'person', label: 'Pedestrian', color: '#B5651D' },
  { id: 'sign', label: 'Traffic sign', color: '#2F6F4F' },
];

export const EVALUATION_ITEM = {
  prompt: 'ما هي عاصمة أستراليا؟ وأذكر سببًا مختصرًا لاختيارها.',
  promptEn: 'What is the capital of Australia? Give a brief reason it was chosen.',
  a: 'عاصمة أستراليا هي سيدني لأنها أكبر مدينة في البلاد.',
  aEn: 'The capital of Australia is Sydney because it is the largest city.',
  b: 'عاصمة أستراليا هي كانبرا. اختيرت كحلٍّ وسط بين سيدني وملبورن اللتين تنافستا على اللقب.',
  bEn: 'The capital of Australia is Canberra. It was chosen as a compromise between Sydney and Melbourne, which both competed for the title.',
};

export const COLLECTION_SHOTS = ['Cup or mug — front view, daylight', 'Cup or mug — top view, indoor light', 'Keys on a table — close-up', 'Phone charger — coiled, plain background', 'Same charger — on a patterned surface'];

export const AGREEMENT_POINTS = [
  'Rates and the payment schedule for this project are set out in the agreement document provided at acceptance.',
  'Payment is issued only for tasks that pass quality review.',
  'Do not include personal information about yourself or others in any submission.',
  'Submitted work is used to train and evaluate AI systems as described in the data use terms.',
  'You can stop working on the project at any time; completed, approved tasks remain payable.',
];
