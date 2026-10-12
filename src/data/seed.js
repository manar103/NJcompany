// SAMPLE DATA — the demo contributor and admin datasets used to preview populated screens.
// All people, applications and activity here are fictional.

export const DEMO_USER = {
  id: 'u-demo',
  email: 'demo.contributor@example.com',
  role: 'contributor',
  emailVerified: true,
  onboarded: true,
  createdAt: '2026-08-02',
  profile: {
    fullName: 'Layla Haddad',
    country: 'Egypt',
    region: 'Middle East & North Africa',
    preferredLanguage: 'English',
    languages: [
      { name: 'Arabic', level: 'native' },
      { name: 'English', level: 'fluent' },
      { name: 'French', level: 'conversational' },
      { name: 'Spanish', level: 'conversational' },
    ],
    skills: ['Transcription', 'Translation', 'Proofreading', 'Audio recording'],
    interests: ['voice', 'transcription', 'translation', 'annotation'],
    experienceSummary: 'Freelance Arabic–English translator for four years. Previously transcribed interviews for a research lab.',
    background: "Bachelor's in English Literature",
    portfolioUrl: '',
    resumeName: 'layla-haddad-cv.pdf',
    availability: 'moderate',
    hoursPerWeek: '15',
    timezone: 'Africa/Cairo (UTC+3)',
  },
};

export const DEMO_ADMIN = {
  id: 'u-admin',
  email: 'ops.demo@example.com',
  role: 'admin',
  emailVerified: true,
  onboarded: true,
  createdAt: '2026-01-10',
  profile: { fullName: 'Operations Demo', country: 'United Kingdom', languages: [], skills: [], interests: [] },
};

const h = (status, at, note) => ({ status, at, note });

export const DEMO_APPLICATIONS = [
  {
    id: 'ap-2001', jobId: 'vl-101', userId: 'u-demo', status: 'accepted', createdAt: '2026-09-02', updatedAt: '2026-09-12',
    assessment: { status: 'completed', completedAt: '2026-09-04' },
    history: [h('submitted', '2026-09-02'), h('assessment_required', '2026-09-02'), h('under_review', '2026-09-04', 'Assessment completed'), h('accepted', '2026-09-12', 'Welcome to the project')],
  },
  {
    id: 'ap-2002', jobId: 'vl-102', userId: 'u-demo', status: 'accepted', createdAt: '2026-09-08', updatedAt: '2026-09-21',
    assessment: { status: 'completed', completedAt: '2026-09-10' },
    history: [h('submitted', '2026-09-08'), h('assessment_required', '2026-09-08'), h('under_review', '2026-09-10', 'Assessment completed'), h('accepted', '2026-09-21')],
  },
  {
    id: 'ap-2003', jobId: 'vl-113', userId: 'u-demo', status: 'accepted', createdAt: '2026-09-22', updatedAt: '2026-10-01',
    assessment: { status: 'completed', completedAt: '2026-09-23' },
    history: [h('submitted', '2026-09-22'), h('assessment_required', '2026-09-22'), h('under_review', '2026-09-23', 'Assessment completed'), h('accepted', '2026-10-01')],
  },
  {
    id: 'ap-2004', jobId: 'vl-104', userId: 'u-demo', status: 'accepted', createdAt: '2026-10-02', updatedAt: '2026-10-09',
    assessment: { status: 'completed', completedAt: '2026-10-03' },
    history: [h('submitted', '2026-10-02'), h('assessment_required', '2026-10-02'), h('under_review', '2026-10-03', 'Assessment completed'), h('accepted', '2026-10-09')],
  },
  {
    id: 'ap-2005', jobId: 'vl-111', userId: 'u-demo', status: 'assessment_required', createdAt: '2026-10-10', updatedAt: '2026-10-10',
    assessment: { status: 'not_started' },
    history: [h('submitted', '2026-10-10'), h('assessment_required', '2026-10-10', 'Complete the labeling guideline quiz')],
  },
  {
    id: 'ap-2006', jobId: 'vl-106', userId: 'u-demo', status: 'under_review', createdAt: '2026-10-08', updatedAt: '2026-10-09',
    assessment: null,
    history: [h('submitted', '2026-10-08'), h('under_review', '2026-10-09')],
  },
  {
    id: 'ap-2007', jobId: 'vl-114', userId: 'u-demo', status: 'submitted', createdAt: '2026-10-11', updatedAt: '2026-10-11',
    assessment: null,
    history: [h('submitted', '2026-10-11')],
  },
  {
    id: 'ap-2008', jobId: 'vl-110', userId: 'u-demo', status: 'rejected', createdAt: '2026-09-15', updatedAt: '2026-09-29',
    assessment: { status: 'completed', completedAt: '2026-09-16' },
    history: [h('submitted', '2026-09-15'), h('assessment_required', '2026-09-15'), h('under_review', '2026-09-16', 'Assessment completed'), h('rejected', '2026-09-29', 'This project requires 3+ years of professional Python experience.')],
  },
  {
    id: 'ap-2009', jobId: 'vl-108', userId: 'u-demo', status: 'withdrawn', createdAt: '2026-09-26', updatedAt: '2026-09-27',
    assessment: { status: 'not_started' },
    history: [h('submitted', '2026-09-26'), h('assessment_required', '2026-09-26'), h('withdrawn', '2026-09-27', 'Withdrawn by you')],
  },
  {
    id: 'ap-2010', jobId: 'vl-105', userId: 'u-demo', status: 'draft', createdAt: '2026-10-11', updatedAt: '2026-10-11',
    assessment: null,
    history: [h('draft', '2026-10-11')],
  },
];

export const DEMO_PROJECTS = [
  { id: 'pr-301', applicationId: 'ap-2001', jobId: 'vl-101', userId: 'u-demo', status: 'active', done: 12, total: 40, startedAt: '2026-09-13', dueAt: '2026-11-06' },
  { id: 'pr-302', applicationId: 'ap-2002', jobId: 'vl-102', userId: 'u-demo', status: 'active', done: 5, total: 20, startedAt: '2026-09-22', dueAt: null },
  { id: 'pr-303', applicationId: 'ap-2003', jobId: 'vl-113', userId: 'u-demo', status: 'active', done: 3, total: 12, startedAt: '2026-10-02', dueAt: null },
  { id: 'pr-304', applicationId: 'ap-2004', jobId: 'vl-104', userId: 'u-demo', status: 'not_started', done: 0, total: 30, startedAt: null, dueAt: null },
];

export const DEMO_NOTIFICATIONS = [
  { id: 'n-1', userId: 'u-demo', type: 'assessment', title: 'Assessment required', body: 'Complete the Labeling guideline quiz for “Short Video Action Labeling”.', at: '2026-10-10T09:20:00', read: false, link: '/app/assessments' },
  { id: 'n-2', userId: 'u-demo', type: 'status', title: 'Application under review', body: '“Household Object Photo Collection” is now being reviewed.', at: '2026-10-09T15:05:00', read: false, link: '/app/applications/ap-2006' },
  { id: 'n-3', userId: 'u-demo', type: 'status', title: 'You were accepted', body: 'You have been accepted to “Street Scene Object Annotation”. Review the project agreement to begin.', at: '2026-10-09T11:00:00', read: false, link: '/app/projects' },
  { id: 'n-4', userId: 'u-demo', type: 'deadline', title: 'Deadline approaching', body: 'The Egyptian Arabic recording project closes on 6 Nov.', at: '2026-10-07T08:00:00', read: true, link: '/app/projects' },
  { id: 'n-5', userId: 'u-demo', type: 'announcement', title: 'New: Arabic opportunities', body: 'Several new Arabic language projects were added this week.', at: '2026-10-03T10:00:00', read: true, link: '/app/opportunities' },
];

// Contributors visible in the admin console (fictional).
export const ADMIN_CONTRIBUTORS = [
  { id: 'c-1', name: 'Layla Haddad', country: 'Egypt', languages: ['Arabic', 'English'], joined: '2026-08-02', applications: 10, status: 'active' },
  { id: 'c-2', name: 'Mateo Ruiz', country: 'Colombia', languages: ['Spanish', 'English'], joined: '2026-07-18', applications: 4, status: 'active' },
  { id: 'c-3', name: 'Aiko Tanaka', country: 'Japan', languages: ['Japanese', 'English'], joined: '2026-09-01', applications: 2, status: 'active' },
  { id: 'c-4', name: 'Chinedu Okafor', country: 'Nigeria', languages: ['Yoruba', 'English'], joined: '2026-06-22', applications: 7, status: 'active' },
  { id: 'c-5', name: 'Priya Raman', country: 'India', languages: ['Hindi', 'English'], joined: '2026-09-14', applications: 3, status: 'paused' },
  { id: 'c-6', name: 'Lucas Ferreira', country: 'Brazil', languages: ['Portuguese', 'English'], joined: '2026-05-30', applications: 6, status: 'active' },
  { id: 'c-7', name: 'Amani Mwangi', country: 'Kenya', languages: ['Swahili', 'English'], joined: '2026-10-03', applications: 1, status: 'active' },
  { id: 'c-8', name: 'Camille Laurent', country: 'France', languages: ['French', 'English'], joined: '2026-08-11', applications: 5, status: 'active' },
];

// Additional applications from other (fictional) contributors so the admin review queue has content.
export const ADMIN_EXTRA_APPLICATIONS = [
  { id: 'ap-3101', jobId: 'vl-103', userId: 'c-6', applicantName: 'Lucas Ferreira', status: 'under_review', createdAt: '2026-10-06', updatedAt: '2026-10-08', assessment: { status: 'completed' }, history: [h('submitted', '2026-10-06'), h('under_review', '2026-10-08')] },
  { id: 'ap-3102', jobId: 'vl-105', userId: 'c-2', applicantName: 'Mateo Ruiz', status: 'under_review', createdAt: '2026-10-09', updatedAt: '2026-10-10', assessment: { status: 'completed', completedAt: '2026-10-10' }, history: [h('submitted', '2026-10-09'), h('assessment_required', '2026-10-09'), h('under_review', '2026-10-10', 'Assessment completed')] },
  { id: 'ap-3103', jobId: 'vl-109', userId: 'c-7', applicantName: 'Amani Mwangi', status: 'assessment_required', createdAt: '2026-10-11', updatedAt: '2026-10-11', assessment: { status: 'not_started' }, history: [h('submitted', '2026-10-11'), h('assessment_required', '2026-10-11')] },
  { id: 'ap-3104', jobId: 'vl-108', userId: 'c-8', applicantName: 'Camille Laurent', status: 'under_review', createdAt: '2026-10-04', updatedAt: '2026-10-07', assessment: { status: 'completed' }, history: [h('submitted', '2026-10-04'), h('under_review', '2026-10-07')] },
  { id: 'ap-3105', jobId: 'vl-107', userId: 'c-5', applicantName: 'Priya Raman', status: 'accepted', createdAt: '2026-09-28', updatedAt: '2026-10-05', assessment: { status: 'completed' }, history: [h('submitted', '2026-09-28'), h('under_review', '2026-10-01'), h('accepted', '2026-10-05')] },
];
