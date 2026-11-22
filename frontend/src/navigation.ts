import type { IconType } from 'react-icons';
import { FaBriefcase, FaEnvelope, FaHouse, FaUser } from 'react-icons/fa6';
import SpinningEarth from './components/SpinningEarth';

// The site's navigation: five groups (phone tab-bar guidance is 3 to 5 destinations), each with
// its pages. A group's tile opens its first page; the others are sub-tabs on the page. Every page
// keeps its own address, so links, bookmarks and the pre-rendered pages are unaffected.

export interface SitePage {
  to: string;
  /** The sub-tab's name. */
  label: string;
}

export interface NavGroup {
  label: string;
  /** Where the tile goes: the group's first page. */
  to: string;
  icon: IconType;
  /** The colour of the icon's 3D tile. */
  colour: string;
  pages: SitePage[];
  /** Shown as a "Contact me" button on wide screens. */
  callToAction?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Home', to: '/home', icon: FaHouse, colour: '#79d2c0', pages: [{ to: '/home', label: 'Home' }] },
  {
    label: 'Experience',
    to: '/resume',
    icon: FaBriefcase,
    colour: '#83b9ff',
    pages: [
      { to: '/resume', label: 'Résumé' },
      { to: '/education', label: 'Education' },
      { to: '/testimonials', label: 'Testimonials' },
    ],
  },
  {
    label: 'Projects',
    to: '/metrics',
    icon: SpinningEarth,
    colour: '#4f7bd9',
    pages: [
      { to: '/metrics', label: 'Quality dashboard' },
      { to: '/analytics', label: 'Site analytics' },
    ],
  },
  {
    label: 'About',
    to: '/about',
    icon: FaUser,
    colour: '#f5c86b',
    pages: [
      { to: '/about', label: 'About me' },
      { to: '/running', label: 'Running' },
      { to: '/charity', label: 'Giving back' },
    ],
  },
  { label: 'Contact', to: '/contact', icon: FaEnvelope, colour: '#ff9f80', pages: [{ to: '/contact', label: 'Contact' }], callToAction: true },
];

/** The group a path belongs to, if any. */
export function groupFor(path: string): NavGroup | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return NAV_GROUPS.find((group) => group.pages.some((page) => page.to === clean));
}
