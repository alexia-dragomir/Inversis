import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import process from 'node:process';
import console from 'node:console';
/* global window, document, requestAnimationFrame */
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_URL||'http://127.0.0.1:5180/';
const dir='.local/verification/navigation'+(process.env.QA_URL?'/public':'');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const errors=[];let checks=0;
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));
  const ready=()=>page.locator('.user-workspace [aria-busy="false"]').waitFor();
  const top=async route=>{
   await ready();await page.waitForFunction(r=>document.title.toLowerCase().endsWith(r),route);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await page.evaluate(()=>window.scrollY),0);
   const box=await page.locator('.header').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=1000);
   assert.equal(await page.locator(`nav a[href="#${route}"]`).getAttribute('aria-current'),'page');checks++;
  };
  for(const route of ['context','decision','stability','certificate']){
   await page.goto(base+'#'+route);await top(route);
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
   // DOM click retains the bottom-of-screen starting position, unlike locator
   // auto-scrolling. Separate keyboard checks exercise real focus traversal.
   await page.locator(`nav a[href="#${route}"]`).evaluate(a=>a.click());await top(route);
   await page.screenshot({path:`${dir}/${route}-${width}.png`});
  }
  for(const route of ['context','decision','stability','certificate']){
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
   await page.locator(`nav a[href="#${route}"]`).evaluate(a=>a.click());await top(route);
  }
  await page.goBack();await top('stability');await page.goForward();await top('certificate');
  await page.locator('nav a[href="#context"]').focus();await page.keyboard.press('Enter');await top('context');
  await page.getByRole('link',{name:'Compare rotations',exact:false}).click();await top('decision');
  await page.locator('nav a[href="#context"]').click();await top('context');
  await page.getByRole('link',{name:'Inspect the comparison',exact:false}).click();await top('decision');
  await page.locator('nav a[href="#stability"]').click();await top('stability');
  await page.getByRole('link',{name:'Inspect the audit record',exact:false}).click();await top('certificate');
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main');assert.ok(await page.evaluate(()=>window.scrollY>0));checks++;
  await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${dir}/result.json`,JSON.stringify({checks,errors},null,2));console.log(`${checks} navigation checks passed; direct links, bottom-to-top, same route, Back/Forward, internal links, keyboard and skip link.`);
}finally{await browser.close();}
