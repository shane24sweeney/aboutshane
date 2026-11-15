/** Every route with its navigation label and page heading. */
export const pages = [
  { path: '/home', nav: 'Home', heading: 'Shane James Sweeney' },
  { path: '/contact', nav: 'Contact', heading: 'Send me a message.' },
  { path: '/about', nav: 'About', heading: 'About Shane' },
  { path: '/resume', nav: 'Resume', heading: 'Professional Experience' },
  { path: '/testimonials', nav: 'Testimonials', heading: 'Testimonials' },
  { path: '/education', nav: 'Education', heading: 'Education' },
  { path: '/charity', nav: 'Charity Work', heading: 'Charity Work' },
] as const;

/**
 * Routes reached from the footer instead of the nav (eight nav icons don't fit a small phone).
 * Kept out of `pages` because the production smoke tests use that list, and these pages may not be
 * deployed yet.
 */
export const footerPages = [{ path: '/running', footer: 'Running', heading: 'Running' }] as const;

/** Every route, for local checks that don't depend on the nav. */
export const allPages = [...pages, ...footerPages];
