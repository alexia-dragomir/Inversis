// Optional headless release check. Uses an externally supplied Playwright runtime;
// no browser or dependency is installed by this script. All artifacts stay ignored.
import { createRequire } from 'node:module';
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
/* global location, document, innerWidth, requestAnimationFrame -- evaluated only inside the isolated browser */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_URL || 'http://127.0.0.1:5180/';
const dir = '.local/verification/completion' + (process.env.QA_URL ? '/public' : '');
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
const live = () => page.locator('.user-workspace');
const demo = () => page.locator('.demo-workspace');
const guide = () => demo().getByRole('complementary', { name: 'Guided demonstration' });
const ready = async scope => { await scope.locator('[aria-busy="false"]').waitFor(); };
const route = async name => { await page.locator(`nav a[href="#${name}"]`).click(); await page.waitForFunction(n => location.hash === '#' + n && document.title.toLowerCase().endsWith(n), name); await ready(live()); };
const exportFrom = async (scope, name) => {
  const pending = page.waitForEvent('download'); await scope.getByRole('button', { name: 'Download certificate JSON' }).click();
  const d = await pending; await d.saveAs(`${dir}/${name}.json`);
  const record = JSON.parse(await readFile(`${dir}/${name}.json`, 'utf8')); delete record.generatedAtUTC; return record;
};
const start = async () => { await live().getByRole('button', { name: 'Explore the guided demo' }).click(); await ready(demo()); await guide().waitFor(); };
const next = async n => { await guide().getByRole('button', { name: 'Next', exact: true }).click(); await guide().getByText(`Step ${n} of 5`, { exact: false }).waitFor(); };
const screenshot = async name => { await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))); await page.screenshot({ path: `${dir}/${name}.png` }); };
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
try {
  await page.goto(base + '#context'); await ready(live());
  assert.equal(await live().locator('.method-overview li').count(), 5);
  await live().locator('.analysis-settings summary').click();
  await live().getByLabel('Crop-window shift').selectOption('7'); await ready(live());
  await live().getByLabel('Illustrative preference', { exact: false }).selectOption('20'); await ready(live());
  await route('certificate'); const before = await exportFrom(live(), 'before-demo');
  assert.equal(before.fingerprint, '0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15');
  await route('context'); await start();
  assert.equal(await live().getAttribute('hidden'), '');
  assert.match(await demo().locator('.analysis-settings summary').innerText(), /Heat 50%.*0 exclusions/);
  await next(2);
  assert.match(await demo().locator('.why-result').innerText(), /0.0481.*0.1364.*0.0883/s);
  await next(3);
  assert.equal(await demo().getByRole('button', { name: 'Inspect replay 2018–2022' }).getAttribute('aria-pressed'), 'true');
  assert.match(await demo().locator('.replay-selection').innerText(), /Alternative B/);
  assert.deepEqual(await demo().locator('.replay-loss > div > strong').allTextContents(), ['0.3921', '0.4328', '0.3440']);
  await next(4);
  assert.equal(await demo().getByRole('slider',{name:'Tested heat preference'}).isDisabled(),true);
  assert.match(await demo().locator('.before-after').innerText(), /Sole eligible plan/);
  assert.match(await demo().locator('.branch-state').last().innerText(), /Not defined/);
  assert.equal(await demo().getByRole('button', { name: 'Apply to analysis' }).count(), 0);
  await guide().getByRole('button', { name: 'Example B · Sunflower' }).click();
  assert.match(await demo().locator('.branch-state').last().innerText(), /No eligible decision/);
  await demo().getByRole('button', { name: 'Permitted', exact: true }).click();
  assert.match(await demo().locator('.branch-state').last().innerText(), /Baseline \+ Alternative A \+ Alternative B/);
  await demo().getByRole('button', { name: 'Prohibited', exact: true }).click();
  await demo().getByRole('button',{name:'Exposure preferences',exact:false}).click();
  assert.equal(await demo().locator('.branch-options [aria-pressed="true"]').count(),1);
  await next(5);
  const reference = await exportFrom(demo(), 'demo-reference');
  assert.equal(reference.fingerprint, '4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194');
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${dir}/demo-reference-a4.pdf`,format:'A4',preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'});
  await guide().getByRole('button', { name: 'Back', exact: true }).click();
  assert.match(await guide().innerText(), /Step 4 of 5/);
  await next(5); await guide().getByRole('button', { name: 'Restart demo' }).click();
  assert.match(await guide().innerText(), /Step 1 of 5/);
  await guide().getByRole('button', { name: 'Exit demo' }).click();
  assert.equal(await demo().count(), 0); assert.equal(new URL(page.url()).hash, '#context');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
  await route('certificate'); assert.deepEqual(await exportFrom(live(), 'after-demo'), before);

  // Exit from every step, including completion, preserves the user's analysis.
  for (let exitAt = 1; exitAt <= 5; exitAt++) {
    await route('context'); await start();
    for (let i = 2; i <= exitAt; i++) await next(i);
    await guide().getByRole('button', { name: exitAt === 5 ? 'Explore independently' : 'Exit demo', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#context');
    assert.match(await live().locator('.analysis-settings summary').innerText(), /Heat 20%.*\+7 days/);
  }
  // All five guide positions at the four required widths, with keyboard entry.
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await route('context');
    await screenshot(`context-${width}`);
    await live().locator('.method-overview').scrollIntoViewIfNeeded(); await screenshot(`methodology-${width}`);
    await live().locator('.method-overview').screenshot({path:`${dir}/methodology-panel-${width}.png`});
    await live().getByRole('button', { name: 'Explore the guided demo' }).focus(); await page.keyboard.press('Enter'); await ready(demo());
    for (let step = 1; step <= 5; step++) {
      await guide().getByText(`Step ${step} of 5`, { exact: false }).waitFor(); await noOverflow();
      assert.equal(await guide().evaluate(e => e.contains(document.activeElement) || e === document.activeElement), true);
      await screenshot(`demo-${step}-${width}`);
      if (step === 4) { await guide().getByRole('button', { name: 'Example B · Sunflower' }).click(); await screenshot(`sunflower-${width}`); }
      if (step < 5) { await guide().getByRole('button', { name: 'Next', exact: true }).focus(); await page.keyboard.press('Enter'); }
    }
    await guide().getByRole('button', { name: 'Explore independently' }).click();
    await route('certificate'); await screenshot(`restored-certificate-${width}`); await noOverflow();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const after = await exportFrom(live(), 'final-restored'); assert.deepEqual(after, before);
  // An unavailable reference must refuse the demo rather than invent rainfall results.
  const unavailable = await browser.newContext();
  await unavailable.route('**/imerg-analysis-input.json', r=>r.fulfill({status:503,body:'Explicit QA fault'}));
  const fault = await unavailable.newPage(); await fault.goto(base+'#context');
  await fault.locator('.user-workspace [aria-busy="false"]').waitFor();
  await fault.getByRole('button',{name:'Explore the guided demo'}).click();
  await fault.getByRole('heading',{name:'Default reference evidence is unavailable.'}).waitFor();
  await fault.getByRole('button',{name:'Exit demo',exact:true}).click();
  assert.match(await fault.locator('.user-workspace .analysis-heading').innerText(),/heat-only/);
  await unavailable.close();
  assert.deepEqual(errors, []);
  await writeFile(`${dir}/result.json`, JSON.stringify({ stateIsolation: true, exitEveryStep: true, restart: true, keyboard: true, widths: [390, 768, 1024, 1440], steps: 5, referenceFingerprint: reference.fingerprint, restoredFingerprint: after.fingerprint, errors }, null, 2));
  console.log('Guided demo: five steps, real replay/eligibility outcomes, all exits, restart, keyboard, four widths and certificate isolation passed.');
} catch (e) { await page.screenshot({ path: `${dir}/failure.png`, fullPage: true }); throw e; }
finally { await browser.close(); }
