import type { Page } from '@playwright/test';
import { pages, type SitePage } from './pages';

/** Where a group's tile goes: its first page. */
export const groupHome = (group: string) => pages.find((p) => p.group === group)!.path;

/** The group's tile in the main navigation (top bar on wide screens, bottom bar on phones). */
export const groupLink = (page: Page, group: string) =>
  page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: group, exact: true });

/** A sub-tab of the current group (Résumé · Education · Testimonials, ...). */
export const subTab = (page: Page, group: string, tab: string) =>
  page.getByRole('navigation', { name: `${group} pages` }).getByRole('link', { name: tab, exact: true });

/**
 * Opens a page the way a visitor does: its group's tile, then its sub-tab if the group opened on
 * another page. `tap` for touch devices.
 */
export async function openFromNav(page: Page, target: Pick<SitePage, 'path' | 'group' | 'tab'>, how: 'click' | 'tap' = 'click') {
  const onTarget = () => new URL(page.url()).pathname === target.path;
  const inGroup = pages.some((p) => p.group === target.group && p.path === new URL(page.url()).pathname);
  if (!onTarget() && !inGroup) {
    await groupLink(page, target.group)[how]();
    await page.waitForURL((url) => url.pathname === groupHome(target.group));
  }
  if (target.tab && !onTarget()) await subTab(page, target.group, target.tab)[how]();
  await page.waitForURL((url) => url.pathname === target.path);
}
