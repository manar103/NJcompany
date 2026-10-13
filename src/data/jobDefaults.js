// Fields every listing needs. Pure module (no browser APIs) so the API can import it too.
// Text is English source; the browser translates it for display.

const STANDARD_STEPS = [
  'Submit a short application confirming your languages and availability.',
  'Complete the project assessment, if one is listed.',
  'Our team reviews your application and assessment results.',
  'If you are accepted, review and sign the project agreement before starting any tasks.',
];

const PAYMENT_NOTE =
  'The exact rate is stated in the project agreement you review before accepting any work. Payment is issued only for tasks that pass quality review, on the schedule set out in that agreement.';

/** Fill the fields every listing needs (standard steps, payment note, empty lists). */
export const withJobDefaults = (j) => ({
  status: 'open',
  steps: STANDARD_STEPS,
  regions: ['Global'],
  responsibilities: [],
  mandatory: [],
  preferred: [],
  equipment: [],
  faqs: [],
  ...j,
  compensation: { details: PAYMENT_NOTE, ...j.compensation },
});
