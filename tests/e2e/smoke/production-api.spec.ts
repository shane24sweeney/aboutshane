import { type APIRequestContext } from '@playwright/test';
import { expect, test } from '../support/smoke-fixtures';
import { expectedRunningStats, raceMiles, raceSeconds } from '../support/running-stats';
import { and, given, then, when } from '../support/steps';

// API contract checks against the live site. Read-only: every contact request here is one the API
// rejects or silently drops, so nothing is stored and no email is sent. A 429 from the 2
// requests/second limit is waited out and retried (see ../support/smoke-fixtures.ts).

test.describe.configure({ mode: 'default' });

const get = (request: APIRequestContext, path: string) => request.get(path);
const postContact = (request: APIRequestContext, data: unknown) => request.post('/api/contact', { data });

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const raceTime = /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/;
const nonBlank = expect.stringMatching(/\S/);

test.describe('production API: content contract', () => {
  test('every content page is cacheable JSON in the shape the site expects', async ({ request }) => {
    const pages: Record<string, unknown> = {};

    await given('the live content API', () => {});
    for (const page of ['profile', 'about', 'resume', 'testimonials', 'education', 'charity', 'running']) {
      await when(`/api/content/${page} is requested`, async () => {
        const response = await get(request, `/api/content/${page}`);
        expect(response.status(), page).toBe(200);
        expect(response.headers()['content-type'], page).toContain('application/json');
        expect(response.headers()['cache-control'], page).toBe('max-age=300, public');
        pages[page] = await response.json();
      });
    }

    await then('the profile and about pages have their text', () => {
      expect(pages.profile).toMatchObject({ name: 'Shane James Sweeney', strengths: expect.any(Array) });
      expect(pages.about).toEqual({ essay: nonBlank, signature: nonBlank });
    });
    await and('every resume role has a company, dates, logo and highlights', () => {
      for (const role of pages.resume as Record<string, unknown>[]) {
        expect(role).toMatchObject({ role: nonBlank, company: nonBlank, dates: nonBlank, logo: nonBlank, highlights: expect.any(Array) });
        expect((role.highlights as unknown[]).length, String(role.company)).toBeGreaterThan(0);
      }
    });
    await and('every testimonial has a name, title and quote', () => {
      for (const testimonial of pages.testimonials as unknown[]) {
        expect(testimonial).toMatchObject({ name: nonBlank, title: nonBlank, recommendation: nonBlank });
      }
    });
    await and('every degree names its school and every charity event has a described image', () => {
      for (const degree of pages.education as unknown[]) expect(degree).toMatchObject({ degree: nonBlank, school: nonBlank, logo: nonBlank });
      for (const event of pages.charity as Record<string, unknown>[]) {
        expect(event).toMatchObject({ title: nonBlank, image: nonBlank, alt: nonBlank });
        if (event.link) expect(event.link).toEqual({ href: expect.stringMatching(/^https:\/\//), label: nonBlank });
      }
    });
  });
});

test.describe('production API: running', () => {
  type Race = { date: string; event: string; location: string; distance: string; time: string; pace: string; place: number; finishers: number };

  test('the race history is complete, consistent and newest first', async ({ request }) => {
    const response = await when('/api/content/running is requested', () => get(request, '/api/content/running'));
    const running = (await response.json()) as { intro: string; profile: { href: string; label: string }; races: Race[] };

    await then('it links the Athlinks profile', () => {
      expect(response.status()).toBe(200);
      expect(running.intro).toMatch(/\S/);
      expect(running.profile.href).toMatch(/^https:\/\/www\.athlinks\.com\/athletes\/\d+$/);
    });
    await and('every race has a date, place, distance, time and pace in the right format', () => {
      expect(running.races.length).toBeGreaterThanOrEqual(24);
      for (const race of running.races) {
        expect(race.date, race.event).toMatch(isoDate);
        expect(race).toMatchObject({ event: nonBlank, location: nonBlank, distance: nonBlank });
        expect(race.time, race.event).toMatch(raceTime);
        expect(race.pace, race.event).toMatch(/^\d{1,2}:[0-5]\d$/);
        expect(race.place, race.event).toBeGreaterThanOrEqual(1);
        expect(race.place, race.event).toBeLessThanOrEqual(race.finishers);
      }
    });
    await and('every pace is the time over the distance, to within 5 seconds a mile', () => {
      for (const race of running.races) {
        const pace = raceSeconds(race.time) / raceMiles(race.distance);
        expect(Math.abs(pace - raceSeconds(race.pace)), race.event).toBeLessThanOrEqual(5);
      }
    });
    await and('the races run newest to oldest', () => {
      const dates = running.races.map((race) => race.date);
      expect(dates).toEqual([...dates].sort().reverse());
    });
  });

  test('the running stats match the live race history', async ({ request }) => {
    const races = await given('the live race history', async () => ((await (await get(request, '/api/content/running')).json()) as { races: Race[] }).races);
    const response = await when('/api/content/running/stats is requested', () => get(request, '/api/content/running/stats'));

    await then('it is JSON that CloudFront may cache for 5 minutes', () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(response.headers()['cache-control']).toBe('max-age=300, public');
    });
    await and('its totals and personal bests equal ones worked out independently from those races', async () => {
      expect(await response.json()).toEqual(expectedRunningStats(races));
    });
  });

  // CloudFront only forwards GET and HEAD on the cached /api/content/* paths, so writes are refused
  // at the edge (403) and never reach the API. The API's own 405 is covered by ContentControllerTest.
  test('the running stats are read-only', { tag: '@negative' }, async ({ request }) => {
    await given('the live stats API', () => {});
    const posted = await when('it is posted to', () => request.post('/api/content/running/stats', { data: {} }));
    await then('CloudFront refuses the write (403)', () => expect(posted.status()).toBe(403));
    const deleted = await when('it is deleted', () => request.delete('/api/content/running/stats'));
    await then('CloudFront refuses the write (403)', () => expect(deleted.status()).toBe(403));
  });

  test('unknown running paths are not found', { tag: '@negative' }, async ({ request }) => {
    for (const path of ['/api/content/running/best', '/api/content/running/stats/5k', '/api/content/RUNNING']) {
      const response = await when(`${path} is requested`, () => get(request, path));
      await then('it answers 404 as JSON', () => {
        expect(response.status(), path).toBe(404);
        expect(response.headers()['content-type'], path).toContain('application/json');
      });
    }
  });

  test('the live running page shows the personal bests from the API', async ({ page }) => {
    const stats = page.waitForResponse('**/api/content/running/stats');

    await when('a visitor opens the running page', () => page.goto('/running'));
    await then('the stats load and the personal bests are shown', async () => {
      const body = (await (await stats).json()) as { personalBests: { distance: string; time: string }[] };
      const cards = page.getByRole('region', { name: 'Personal bests' }).getByRole('listitem');
      await expect(cards).toHaveCount(body.personalBests.length);
      await expect(cards.first()).toContainText(body.personalBests[0]!.time);
    });
  });
});

test.describe('production API: contact validation', () => {
  test('rejects an empty body, naming every required field', { tag: '@negative' }, async ({ request }) => {
    const response = await when('an empty JSON object is posted', () => postContact(request, {}));
    await then('it is rejected with 400 for the name, email and message', async () => {
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('validation_failed');
      expect(Object.keys(body.fields).sort()).toEqual(['email', 'message', 'name']);
    });
  });

  test('enforces every field length limit', { tag: '@negative' }, async ({ request }) => {
    const response = await when('a message one character over each limit is posted', () =>
      postContact(request, {
        name: 'n'.repeat(101),
        email: `${'e'.repeat(64)}@${'d'.repeat(180)}.example.com`,
        message: 'm'.repeat(5001),
        website: 'w'.repeat(201),
      }),
    );
    await then('it is rejected with 400, naming all four fields', async () => {
      expect(response.status()).toBe(400);
      expect(Object.keys((await response.json()).fields).sort()).toEqual(['email', 'message', 'name', 'website']);
    });
  });

  test('treats each length limit as inclusive', { tag: '@negative' }, async ({ request }) => {
    const response = await when('a message exactly at each limit, but with an invalid email, is posted', () =>
      postContact(request, { name: 'n'.repeat(100), email: 'not-an-email', message: 'm'.repeat(5000), website: '' }),
    );
    await then('only the email is rejected, so the other limits are inclusive', async () => {
      expect(response.status()).toBe(400);
      expect(Object.keys((await response.json()).fields)).toEqual(['email']);
    });
  });

  test('tells a bot that fills the hidden honeypot field that its message was received', { tag: '@negative' }, async ({ request }) => {
    const response = await when('a valid message with the honeypot field filled in is posted', () =>
      postContact(request, {
        name: 'Playwright Honeypot Check',
        email: 'honeypot-check@example.com',
        message: 'Automated production check: this message is dropped by the spam honeypot and never stored.',
        website: 'https://spam.example.com',
      }),
    );
    await then('it answers 202 like a real send, without signalling that it was dropped', async () => {
      expect(response.status()).toBe(202);
      expect(await response.json()).toEqual({ status: 'received' });
    });
  });
});
