export const API_BASE = 'http://localhost:3333/api';
export const TOKEN_KEY = 'sos_admin_token';
export const USER_KEY = 'sos_admin_user';

export const STATUS_LABELS = {
  wounded: 'Wounded', deceased: 'Deceased', investigating: 'Investigating',
  treated: 'Treated', released: 'Released', handled: 'Handled',
  verified: 'Verified', archived: 'Archived',
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export const NOTE_TEMPLATES = [
  { label: 'Dispatched rescue team', text: 'Rescue team dispatched to the location. Awaiting on-site confirmation.' },
  { label: 'Awaiting vet assessment', text: 'Animal transported to partner clinic. Awaiting veterinary assessment.' },
  { label: 'No animal found on-site', text: 'Team arrived on-site; no animal was found. Marking as unresolved for follow-up.' },
  { label: 'Reporter unreachable', text: 'Attempted to contact reporter for additional details; no response.' },
  { label: 'Released back to habitat', text: 'Animal treated and released back into its natural habitat.' },
];
