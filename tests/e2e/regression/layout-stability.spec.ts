import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';
import { given, then, when } from '../support/steps';

// Cumulative layout shift: how much the page jumps while it loads. Google counts under 0.1 as
// good. Measured on a slow phone connection and CPU, where a jump is easy to see; a fast load
// can hide one. Chromium only: WebKit has no layout-shift API or network throttling.
const GOOD_CLS = 0.1;

test.describe('layout stability', () => {
  for (const { path } of pages) {
    test(`${path} doesn't jump while it loads on a slow phone`, async ({ page, browserName, context }) => {
      test.skip(browserName !== 'chromium', 'layout-shift API and throttling are Chromium-only');

      await given('a slow 4G connection and a phone-speed CPU', async () => {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8,
        });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.addInitScript(() => {
          type Shift = { value: number; hadRecentInput: boolean; sources: { node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[] };
          const w = window as unknown as { __cls: number; __moved: string[] };
          w.__cls = 0;
          w.__moved = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as Shift[]) {
              if (entry.hadRecentInput) continue;
              w.__cls += entry.value;
              // What moved, for the failure message.
              for (const { node, previousRect: a, currentRect: b } of entry.sources) {
                const el = node instanceof Element ? node : node?.parentElement;
                const name = el ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}` : 'text';
                w.__moved.push(`${name} y ${Math.round(a.y)}→${Math.round(b.y)}, height ${Math.round(a.height)}→${Math.round(b.height)} (+${entry.value.toFixed(3)})`);
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
        });
      });
      await when(`the visitor opens ${path}`, async () => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      });
      await then(`it shifts less than ${GOOD_CLS}`, async () => {
        const { cls, moved } = await page.evaluate(() => {
          const w = window as unknown as { __cls: number; __moved: string[] };
          return { cls: w.__cls, moved: w.__moved };
        });
        expect(cls, `cumulative layout shift; what moved:\n${moved.join('\n')}`).toBeLessThan(GOOD_CLS);
      });
    });
  }
});
