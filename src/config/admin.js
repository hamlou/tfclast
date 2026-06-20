export const ADMIN_EMAILS = [
  'benbrayekhamza1@gmail.com',
  'tfcevents67@gmail.com',
];

export const isAdminEmail = (email) => (
  ADMIN_EMAILS.includes((email || '').trim().toLowerCase())
);
