import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import running from '../../../content/running.json' with { type: 'json' };
import { expectedRunningStats, raceMiles, raceSeconds } from '../support/running-stats';
import { and, given, then, when } from '../support/steps';

// The running page: race history from GET /api/content/running, and totals and personal bests from
// GET /api/content/running/stats. Locally both are served by ../support/fixtures.ts.

const races = running.races;
const stats = expectedRunningStats();
const newest = races[0]!;

const table = (page: Page) => page.getByRole('table', { name: 'Race results' });
const rows = (page: Page) => table(page).locator('tbody tr');
const bests = (page: Page) => page.getByRole('region', { name: 'Personal bests' }).getByRole('listitem');

/** "Nov 27, 2025", the way the page writes an ISO date. */
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

test.describe('running page: race history', () => {
  test('lists every race, newest first, with date, location, time, pace and placing', async ({ page }) => {
    const years = races.map((race) => race.date.slice(0, 4));

    await given('the visitor is on the running page', () => page.goto('/running'));
    await then('the page has its own visible heading', () => expect(page.getByRole('heading', { level: 1, name: 'Running' })).toBeVisible());
    await and('the summary counts the races and the years they span', () =>
      expect(page.locator('.running-summary')).toHaveText(`${races.length} races · ${years[years.length - 1]} – ${years[0]}`),
    );
    await and('there is one row per race', () => expect(rows(page)).toHaveCount(races.length));
    await and('each row shows that race, in newest-first order', async () => {
      for (const [index, race] of races.entries()) {
        const row = rows(page).nth(index);
        await expect(row.locator('time')).toHaveAttribute('datetime', race.date);
        await expect(row.locator('time')).toHaveText(shortDate(race.date));
        await expect(row.locator('.running-event')).toHaveText(race.event);
        await expect(row.locator('.running-location')).toHaveText(race.location);
        await expect(row.locator('.running-time')).toHaveText(race.time);
        await expect(row).toContainText(race.distance);
        await expect(row).toContainText(`${race.pace} /mi`);
        await expect(row).toContainText(`${race.place.toLocaleString('en-US')} of ${race.finishers.toLocaleString('en-US')}`);
      }
    });
  });

  test('labels its columns Date, Race, Distance, Time, Pace and Overall', async ({ page }) => {
    await given('the visitor is on the running page', () => page.goto('/running'));
    await then('the table has those column headers, in order', () =>
      expect(table(page).getByRole('columnheader')).toHaveText(['Date', 'Race', 'Distance', 'Time', 'Pace', 'Overall']),
    );
  });

  test('the race data is consistent: newest first, placed within the field, pace matching time and distance', async ({ page }) => {
    await given('the race history the API serves', () => page.goto('/running'));
    await then('dates run newest to oldest', () => {
      const dates = races.map((race) => race.date);
      expect(dates).toEqual([...dates].sort().reverse());
    });
    await and('no race is listed twice', () => {
      const keys = races.map((race) => `${race.date} ${race.event}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
    await and('every place is within its field', () => {
      for (const race of races) expect(race.place, race.event).toBeGreaterThanOrEqual(1);
      for (const race of races) expect(race.place, race.event).toBeLessThanOrEqual(race.finishers);
    });
    await and('every pace is the time over the distance, to within 5 seconds a mile', () => {
      for (const race of races) {
        const pace = raceSeconds(race.time) / raceMiles(race.distance);
        expect(Math.abs(pace - raceSeconds(race.pace)), `${race.event} pace`).toBeLessThanOrEqual(5);
      }
    });
  });

  test('the race profile link opens Athlinks in a new tab', async ({ page }) => {
    const profile = page.getByRole('button', { name: running.profile.label });

    await given('the visitor is on the running page', () => page.goto('/running'));
    await then('the link goes to the Athlinks profile in a new tab', async () => {
      await expect(profile).toHaveAttribute('href', running.profile.href);
      await expect(profile).toHaveAttribute('target', '_blank');
      await expect(profile).toHaveAttribute('rel', /noreferrer/);
    });
  });

  test.describe('in a time zone behind UTC', () => {
    test.use({ timezoneId: 'Pacific/Honolulu' });

    test('dates do not shift to the day before', async ({ page }) => {
      await given('a visitor in Honolulu (UTC-10)', () => {});
      await when('they open the running page', () => page.goto('/running'));
      await then(`the newest race is still dated ${shortDate(newest.date)}`, () =>
        expect(rows(page).first().locator('time')).toHaveText(shortDate(newest.date)),
      );
    });
  });

  test('writes large fields with thousands separators', async ({ page }) => {
    await given('the content API returns a race with 12,345 finishers', () =>
      page.route('**/api/content/running', (route) =>
        route.fulfill({ json: { ...running, races: [{ ...newest, place: 1234, finishers: 12345 }] } }),
      ),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the placing reads "1,234 of 12,345"', () => expect(rows(page).first()).toContainText('1,234 of 12,345'));
  });

  test('says "1 race" and a single year when there is only one race', { tag: '@negative' }, async ({ page }) => {
    await given('the content API returns a single race', () =>
      page.route('**/api/content/running', (route) => route.fulfill({ json: { ...running, races: [newest] } })),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the summary is singular and names one year', async () => {
      await expect(page.locator('.running-summary')).toHaveText(`1 race · ${newest.date.slice(0, 4)}`);
      await expect(rows(page)).toHaveCount(1);
    });
  });

  test('shows an empty table, without a summary, when there are no races', { tag: '@negative' }, async ({ page }) => {
    await given('the content API returns no races', () =>
      page.route('**/api/content/running', (route) => route.fulfill({ json: { ...running, races: [] } })),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the table has headers but no rows, and the summary is blank', async () => {
      await expect(table(page).getByRole('columnheader')).toHaveCount(6);
      await expect(rows(page)).toHaveCount(0);
      await expect(page.locator('.running-summary')).toHaveText('');
    });
  });

  test('falls back to the bundled race history when the API fails', { tag: '@negative' }, async ({ page }) => {
    await given('the running content API fails with a 500', () =>
      page.route('**/api/content/running', (route) => route.fulfill({ status: 500, json: { error: 'internal_error' } })),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('every bundled race is still listed', () => expect(rows(page)).toHaveCount(races.length));
  });

  test('falls back to the bundled race history when a race is missing its placing', { tag: '@negative' }, async ({ page }) => {
    await given('the content API returns a race whose place is not a number', () =>
      page.route('**/api/content/running', (route) =>
        route.fulfill({ json: { ...running, races: [{ ...newest, event: 'Bad race', place: 'first' }] } }),
      ),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the bad response is ignored and the bundled races are shown', async () => {
      await expect(rows(page)).toHaveCount(races.length);
      await expect(page.getByText('Bad race')).toHaveCount(0);
    });
  });
});

test.describe('running page: personal bests from the stats API', () => {
  test('requests the stats once, with GET', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/api/content/running/stats')) requests.push(request.method());
    });

    await given('the visitor is on the running page', () => page.goto('/running'));
    await then('the personal bests are shown', () => expect(bests(page)).toHaveCount(stats.personalBests.length));
    await and('the stats were requested exactly once, with GET', () => expect(requests).toEqual(['GET']));
  });

  test('shows total race miles and time, and the fastest race at each distance, shortest first', async ({ page }) => {
    await given('the visitor is on the running page', () => page.goto('/running'));
    await then(`the totals read "${stats.totalMiles} race miles · ${stats.totalTime} racing"`, () =>
      expect(page.locator('.running-totals')).toHaveText(`${stats.totalMiles.toLocaleString('en-US')} race miles · ${stats.totalTime} racing`),
    );
    await and(`there is one personal best for each of the ${stats.personalBests.length} distances`, async () => {
      await expect(page.getByRole('heading', { level: 2, name: 'Personal bests' })).toBeVisible();
      await expect(bests(page).locator('.running-best-distance')).toHaveText(stats.personalBests.map((best) => best.distance));
    });
    await and('each shows its time, pace, race and date', async () => {
      for (const [index, best] of stats.personalBests.entries()) {
        const card = bests(page).nth(index);
        await expect(card.locator('.running-best-time')).toHaveText(best.time);
        await expect(card).toContainText(`${best.pace} /mi · ${best.event}, ${shortDate(best.date)}`);
        await expect(card.locator('time')).toHaveAttribute('datetime', best.date);
      }
    });
  });

  test('each personal best is the fastest time in the race table at that distance', async ({ page }) => {
    await given('the visitor is on the running page', () => page.goto('/running'));
    await then('no race at a distance beats its personal best', async () => {
      await expect(bests(page)).toHaveCount(stats.personalBests.length);
      for (const best of stats.personalBests) {
        const times = races.filter((race) => race.distance === best.distance).map((race) => raceSeconds(race.time));
        expect(raceSeconds(best.time), best.distance).toBe(Math.min(...times));
      }
    });
    await and('every personal best race is a row in the table', async () => {
      for (const best of stats.personalBests) {
        await expect(rows(page).filter({ hasText: best.event }).filter({ hasText: best.time })).toHaveCount(1);
      }
    });
  });

  for (const [problem, answer] of [
    ['fails with a 500', { status: 500, json: { error: 'internal_error' } }],
    ['is not found', { status: 404, json: { error: 'request_rejected' } }],
    ['answers with HTML', { status: 200, contentType: 'text/html', body: '<html>Bad gateway</html>' }],
    ['has the wrong shape', { status: 200, json: { personalBests: 'fast' } }],
  ] as const) {
    test(`leaves the personal bests out when the stats API ${problem}, and still lists every race`, { tag: '@negative' }, async ({ page }) => {
      await given(`the stats API ${problem}`, () => page.route('**/api/content/running/stats', (route) => route.fulfill(answer)));
      await when('the visitor opens the running page', () => page.goto('/running'));
      await then('every race is listed', () => expect(rows(page)).toHaveCount(races.length));
      await and('there is no personal bests section', async () => {
        await expect(page.getByRole('heading', { name: 'Personal bests' })).toHaveCount(0);
        await expect(page.locator('.running-totals')).toHaveCount(0);
      });
    });
  }

  test('leaves the personal bests out when the network drops the stats request', { tag: '@negative' }, async ({ page }) => {
    await given('the connection to the stats API is reset', () =>
      page.route('**/api/content/running/stats', (route) => route.abort('connectionreset')),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the races are listed without personal bests', async () => {
      await expect(rows(page)).toHaveCount(races.length);
      await expect(page.getByRole('heading', { name: 'Personal bests' })).toHaveCount(0);
    });
  });

  test('leaves the personal bests out when there are none', { tag: '@negative' }, async ({ page }) => {
    await given('the stats API returns no personal bests', () =>
      page.route('**/api/content/running/stats', (route) => route.fulfill({ json: { ...stats, personalBests: [] } })),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('there is no empty personal bests section', () =>
      expect(page.getByRole('heading', { name: 'Personal bests' })).toHaveCount(0),
    );
  });

  test('shows what the stats API returns', async ({ page }) => {
    await given('the stats API returns a single personal best', () =>
      page.route('**/api/content/running/stats', (route) =>
        route.fulfill({
          json: {
            ...stats,
            totalMiles: 1234.5,
            totalTime: '200:00:00',
            personalBests: [{ distance: 'Marathon', miles: 26.2, time: '3:59:59', pace: '9:09', event: 'API Marathon', date: '2024-03-17' }],
          },
        }),
      ),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the page shows exactly that', async () => {
      await expect(page.locator('.running-totals')).toHaveText('1,234.5 race miles · 200:00:00 racing');
      await expect(bests(page)).toHaveCount(1);
      await expect(bests(page).first()).toContainText('Marathon3:59:59');
      await expect(bests(page).first()).toContainText('API Marathon, Mar 17, 2024');
    });
  });
});

test.describe('running page on a narrow phone', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('each race becomes a card whose cells are labelled', async ({ page }) => {
    const firstRow = rows(page).first();

    await given('a visitor on a 360px-wide phone opens the running page', () => page.goto('/running'));
    await then('the column headers are hidden from view but kept for screen readers', async () => {
      await expect(table(page).locator('thead')).toBeAttached();
      expect(await table(page).locator('thead').evaluate((head) => head.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
    });
    await and('each cell shows its own label', async () => {
      const labels = await firstRow
        .locator('td:not(.running-race)')
        .evaluateAll((cells) => cells.map((cell) => getComputedStyle(cell, '::before').content.replaceAll('"', '')));
      expect(labels).toEqual(['Date', 'Distance', 'Time', 'Pace', 'Overall']);
    });
    await and('the personal best cards stack in one column and fit the screen', async () => {
      const boxes = await bests(page).evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect()));
      expect(boxes.length).toBe(stats.personalBests.length);
      expect(new Set(boxes.map((box) => Math.round(box.left))).size).toBe(1);
      for (const box of boxes) expect(box.right).toBeLessThanOrEqual(360);
    });
    await and('the page does not scroll sideways', async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    });
  });
});

test.describe('running page: race map', () => {
  const towns = [...new Set(races.map(({ location }) => location))];
  const map = (page: Page) => page.getByRole('region', { name: /^Map of race locations/ });
  const pins = (page: Page) => map(page).locator('.race-pin');

  test('shows one pin per town above the results table', async ({ page }) => {
    await given('the visitor is on the running page', () => page.goto('/running'));
    await then(`the map has a pin for each of the ${towns.length} towns`, async () => {
      await expect(map(page)).toHaveAccessibleName(`Map of race locations: ${towns.length} places`);
      await expect(pins(page)).toHaveCount(towns.length);
    });
    await and('it sits above the results table', async () => {
      const mapBox = (await map(page).boundingBox())!;
      const tableBox = (await table(page).boundingBox())!;
      expect(mapBox.y + mapBox.height).toBeLessThanOrEqual(tableBox.y);
    });
    await and('it credits OpenStreetMap', () => expect(map(page).getByRole('link', { name: 'OpenStreetMap' })).toBeVisible());
  });

  test('clicking a pin lists the races run in that town', async ({ page }) => {
    const town = 'Helen, GA';
    const inTown = races.filter(({ location }) => location === town);

    await given('the visitor is on the running page', () => page.goto('/running'));
    await when(`they click the pin for ${town}`, () => map(page).locator(`.race-pin[data-location="${town}"]`).click());
    await then(`a popup lists all ${inTown.length} races there`, async () => {
      const popup = map(page).locator('.leaflet-popup-content');
      await expect(popup).toContainText(town);
      await expect(popup.getByRole('listitem')).toHaveCount(inTown.length);
      for (const { event, time } of inTown) {
        await expect(popup).toContainText(event);
        await expect(popup).toContainText(time);
      }
    });
  });

  test('leaves the map out when there are no races', { tag: '@negative' }, async ({ page }) => {
    await given('the race history is empty', () =>
      page.route('**/api/content/running', (route) => route.fulfill({ json: { ...running, races: [] } })),
    );
    await when('the visitor opens the running page', () => page.goto('/running'));
    await then('the table shows, without a map', async () => {
      await expect(table(page)).toBeAttached();
      await expect(map(page)).toHaveCount(0);
    });
  });
});
