import { expect, test } from '../support/fixtures';
import { groupHome, groupLink, openFromNav, subTab } from '../support/navigate';
import { groups, pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

test.describe('navigation', () => {
  test('the navigation has five groups, in order', async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));
    await then('it lists Home, Experience, Quality, About and Contact', () =>
      expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link')).toHaveText(
        groups.map((g) => (g === 'Contact' ? /Contact/ : g)),
      ),
    );
  });

  test('every page opens from its group and sub-tab, with both marked', async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));

    for (const target of pages) {
      const { path, group, tab, heading } = target;
      await when(`they open ${tab ?? group} from the ${group} group`, () => openFromNav(page, target));
      await then(`${path} opens with its heading, and ${group} is highlighted`, async () => {
        await expect(page).toHaveURL(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
        await expect(groupLink(page, group)).toHaveClass(/active/);
        await expect(groupLink(page, group)).toHaveAttribute('aria-current', 'page');
      });
      if (tab) {
        await and(`its ${tab} sub-tab is marked as the current page`, () => expect(subTab(page, group, tab)).toHaveAttribute('aria-current', 'page'));
      }
    }
  });

  test('each group opens on its first page, with sub-tabs for the rest', async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));
    for (const group of ['Experience', 'Quality', 'About']) {
      const inGroup = pages.filter((p) => p.group === group);
      await when(`they click ${group}`, () => groupLink(page, group).click());
      await then(`${groupHome(group)} opens, with a sub-tab for each of its ${inGroup.length} pages`, async () => {
        await expect(page).toHaveURL(groupHome(group));
        await expect(page.getByRole('navigation', { name: `${group} pages` }).getByRole('link')).toHaveText(inGroup.map((p) => p.tab!));
      });
    }
    await when('they go to a page without sub-tabs', () => groupLink(page, 'Home').click());
    await then('no sub-tabs are shown', async () => {
      for (const group of ['Experience', 'Quality', 'About']) await expect(page.getByRole('navigation', { name: `${group} pages` })).toHaveCount(0);
    });
  });

  test('the sub-tabs work from the keyboard', async ({ page }) => {
    await given('the visitor is on the résumé', () => page.goto('/resume'));
    await when('they move to the Education sub-tab with Tab and press Enter', async () => {
      await subTab(page, 'Experience', 'Education').focus();
      await page.keyboard.press('Enter');
    });
    await then('Education opens', () => expect(page).toHaveURL('/education'));
  });

  test('the footer lists every page', async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));
    await then('the footer links to every page with a sub-tab', async () => {
      const map = page.getByRole('navigation', { name: 'All pages' });
      for (const { path, tab } of pages.filter((p) => p.tab)) {
        await expect(map.getByRole('link', { name: tab, exact: true })).toHaveAttribute('href', path);
      }
    });
  });

  for (const { path, heading } of pages) {
    test(`deep link ${path} loads directly`, async ({ page }) => {
      await given('a visitor has a link to the page', () => {});
      await when(`they open ${path} directly`, () => page.goto(path));
      await then('the page shows its one heading', async () => {
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      });
    });
  }

  for (const path of ['/this-page-does-not-exist', '/resume/not-a-page', '/Contact-us', '/%3Cscript%3E']) {
    test(`unknown path ${path} redirects to the home page`, { tag: '@negative' }, async ({ page }) => {
      await given('a visitor has a link to a page that does not exist', () => {});
      await when(`they open ${path}`, () => page.goto(path));
      await then('they land on the home page', async () => {
        await expect(page).toHaveURL('/home');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shane James Sweeney');
      });
    });
  }

  test('pages load without console errors', async ({ page }) => {
    const errors: string[] = [];

    await given('console errors and page errors are being recorded', () => {
      page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
      page.on('pageerror', (error) => errors.push(error.message));
    });
    await when('the visitor opens every page', async () => {
      for (const { path } of pages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
    });
    await then('no errors were logged', () => expect(errors).toEqual([]));
  });
});
