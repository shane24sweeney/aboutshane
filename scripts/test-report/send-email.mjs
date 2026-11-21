// Wraps the report email as a raw MIME message for `aws sesv2 send-email --content file://...`,
// with the donut chart attached inline (cid:charts), since email apps don't draw SVG.
//
//   REPORT_EMAIL=... node scripts/test-report/send-email.mjs <dir> <message.json>
//
// <dir> holds email.html, email-subject.txt and, if it rendered, email-chart.png.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir = 'reports', out = 'message.json'] = process.argv.slice(2);
const to = process.env.REPORT_EMAIL;
const from = process.env.REPORT_FROM ?? 'Daily quality report <noreply@selenium-automation.com>';
if (!to) throw new Error('REPORT_EMAIL is not set');

// Base64 in 76-character lines, as MIME expects.
const wrap = (buffer) => buffer.toString('base64').replace(/.{76}/g, '$&\r\n');
const subject = readFileSync(join(dir, 'email-subject.txt'), 'utf8').trim();
const html = readFileSync(join(dir, 'email.html'));
const chartFile = join(dir, 'email-chart.png');
const boundary = `report-${Date.now().toString(36)}`;

const parts = [
  [`Content-Type: text/html; charset=UTF-8`, `Content-Transfer-Encoding: base64`, '', wrap(html)].join('\r\n'),
];
if (existsSync(chartFile)) {
  parts.push([
    'Content-Type: image/png; name="charts.png"',
    'Content-Transfer-Encoding: base64',
    'Content-ID: <charts>',
    'Content-Disposition: inline; filename="charts.png"',
    '',
    wrap(readFileSync(chartFile)),
  ].join('\r\n'));
}

const message = [
  `From: ${from}`,
  `To: ${to}`,
  `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
  'MIME-Version: 1.0',
  `Content-Type: multipart/related; boundary="${boundary}"; type="text/html"`,
  '',
  ...parts.map((part) => `--${boundary}\r\n${part}`),
  `--${boundary}--`,
  '',
].join('\r\n');

// The CLI reads blobs in a JSON input file as base64.
writeFileSync(out, JSON.stringify({ Raw: { Data: Buffer.from(message).toString('base64') } }));
console.log(`Wrote ${out}: ${(message.length / 1024).toFixed(0)} KB${existsSync(chartFile) ? ', with chart' : ''}`);
