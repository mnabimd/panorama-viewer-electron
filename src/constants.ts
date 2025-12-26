export const PROJECT_CATEGORIES = [
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'tourism', label: 'Tourism' },
  { id: 'education', label: 'Education' },
  { id: 'events', label: 'Events' },
  { id: 'other', label: 'Other' },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]['id'];
