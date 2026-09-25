// Renders og-image.html to public/og-image.png at the 1200x630 size link previews expect.
import { chromium } from '@playwright/test';

const template = new URL('./og-image.html', import.meta.url);
const output = new URL('../../public/og-image.png', import.meta.url);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(template.href);
await page.locator('img.photo').evaluate((img) => img.decode());
await page.screenshot({ path: output.pathname });
await browser.close();
console.log(`Wrote ${output.pathname}`);
