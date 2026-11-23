/**
 * Every route: its navigation group, its sub-tab (pages that share a group with others), and its
 * page heading. Mirrors frontend/src/navigation.ts.
 */
export const pages = [
  { path: '/home', group: 'Home', tab: undefined, heading: 'Shane James Sweeney' },
  { path: '/resume', group: 'Experience', tab: 'Résumé', heading: 'Professional Experience' },
  { path: '/education', group: 'Experience', tab: 'Education', heading: 'Education' },
  { path: '/testimonials', group: 'Experience', tab: 'Testimonials', heading: 'Testimonials' },
  { path: '/metrics', group: 'Projects', tab: 'Quality dashboard', heading: 'Quality dashboard' },
  { path: '/analytics', group: 'Projects', tab: 'Site analytics', heading: 'Site analytics' },
  { path: '/about', group: 'About', tab: 'About me', heading: 'About Shane' },
  { path: '/running', group: 'About', tab: 'Running', heading: 'Running' },
  { path: '/charity', group: 'About', tab: 'Giving back', heading: 'Giving back' },
  { path: '/contact', group: 'Contact', tab: undefined, heading: 'Send me a message.' },
] as const;

export type SitePage = (typeof pages)[number];

/** The five navigation groups, in order. */
export const groups = ['Home', 'Experience', 'Projects', 'About', 'Contact'] as const;
