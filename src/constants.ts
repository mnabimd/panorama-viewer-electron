export const PROJECT_CATEGORIES = [
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'tourism', label: 'Tourism' },
  { id: 'education', label: 'Education' },
  { id: 'events', label: 'Events' },
  { id: 'other', label: 'Other' },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]['id'];

export const FAKE_PANORAMA_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

// Fake scene object used for auto-play on project load
export const FAKE_SCENE = {
  id: '__fake__',
  name: 'Loading...',
  imagePath: FAKE_PANORAMA_DATA_URL,
  mediaType: 'image' as const,
  hotspots: [],
  isVisible: true,
}