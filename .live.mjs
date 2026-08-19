import { chromium } from '@playwright/test';
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  proxy: proxy ? { server: proxy } : undefined,
  args: ['--ignore-certificate-errors'],
});
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0,300)); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0,300)));
p.on('response', r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url().slice(0,120)}`); });

await p.goto('https://nsosyal-5n1k.onrender.com/login', { waitUntil: 'networkidle', timeout: 90000 });
console.log('landed:', p.url());

const btn = p.getByRole('button').filter({ hasText: /demo|Elif|kullanıcı|Giriş/i }).first();
console.log('button text:', await btn.textContent().catch(()=>'(none found)'));
await btn.click().catch(e => console.log('click threw:', e.message.slice(0,200)));
await p.waitForTimeout(6000);
console.log('after click:', p.url());
console.log('cookies:', (await p.context().cookies()).map(c => `${c.name}=${c.value.slice(0,12)}`).join(', ') || '(none)');
console.log('--- errors ---');
console.log(errs.join('\n') || '(none)');
await p.screenshot({ path: process.argv[2] + '/live-after-click.png' });
await b.close();
