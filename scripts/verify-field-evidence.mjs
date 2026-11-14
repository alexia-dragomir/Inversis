import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import process from 'node:process';
import console from 'node:console';
import assert from 'node:assert/strict';
/* global document, location, innerWidth, localStorage, sessionStorage, requestAnimationFrame */
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_URL||'http://127.0.0.1:5180/';
const dir='.local/verification/field'+(process.env.QA_URL?'/public':'');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];const requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
const live=page.locator('.user-workspace');const field=live.locator('.field-evidence');
const ready=()=>live.locator('[aria-busy="false"]').waitFor();
const route=async name=>{await page.locator(`nav a[href="#${name}"]`).click();await page.waitForFunction(n=>location.hash==='#'+n&&document.title.toLowerCase().endsWith(n),name);await ready();};
const download=async(scope,label,name)=>{const pending=page.waitForEvent('download');await scope.getByRole('button',{name:label,exact:false}).click();const d=await pending;await d.saveAs(`${dir}/${name}.json`);return JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));};
const cert=async name=>{await route('certificate');const c=await download(live,'Download certificate JSON',name);delete c.generatedAtUTC;return c;};
const fieldExport=async name=>{await route('context');const c=await download(field,'Download field notes JSON',name);delete c.exportedAtUTC;return c;};
const open=async()=>{if(!await field.locator('.field-intake').getAttribute('open').then(v=>v!==null))await field.locator('.field-intake summary').click();};
try{
 await page.goto(base+'#certificate');await ready();const baseline=await cert('default-before');assert.equal(baseline.fingerprint,'4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194');
 await live.locator('.analysis-settings summary').click();await live.getByLabel('Crop-window shift').selectOption('7');await ready();await live.getByLabel('Illustrative preference',{exact:false}).selectOption('20');await ready();const before=await cert('nondefault-before');
 const empty=await fieldExport('unknown');assert.ok(empty.fields.every(f=>f.status==='unknown'&&f.value===null));await open();
 await field.getByLabel('Soil pH',{exact:true}).fill('15');assert.equal(await field.getByRole('button',{name:'Download field notes JSON'}).isDisabled(),true);assert.match(await field.innerText(),/Enter a number from 0 to 14/);
 await field.getByLabel('Soil pH',{exact:true}).fill('6.5');
 const values=[['Soil texture','Supplied clay loam'],['Soil organic matter (%)','3.2'],['Drainage','Poorly drained'],['Irrigation','Rain-fed'],['Previous crop','Soybean'],['Disease history','No history reported'],['Local crop timing','User reports flowering in July; needs local verification.']];
 for(const [label,value] of values){const input=field.getByLabel(label,{exact:true});if(await input.evaluate(e=>e.tagName)==='SELECT')await input.selectOption(value);else await input.fill(value);}
 await field.getByLabel('Disease history note (optional)').fill('Reported status only, not proof of absence.');
 for(const label of ['Soil pH',...values.map(v=>v[0])]){await field.getByLabel('Source classification · '+label,{exact:true}).selectOption('Laboratory report, reported by user');await field.getByLabel('Source reference · '+label,{exact:true}).fill('Test reference supplied for browser verification');}
 const notes=await fieldExport('populated');assert.equal(notes.fields.filter(f=>f.status==='supplied').length,8);assert.ok(notes.fields.every(f=>f.verification==='Supplied — not independently verified'));
 assert.deepEqual(await cert('nondefault-after'),before);
 await route('stability');assert.match(await live.locator('.field-connection').innerText(),/8 of 8/);await live.getByRole('link',{name:'Review field information in Context'}).click();await field.waitFor();await page.waitForFunction(()=>document.activeElement?.classList.contains('field-evidence'));
 assert.deepEqual(await fieldExport('after-navigation'),notes);
 for(let stop=1;stop<=5;stop++){
  await live.getByRole('button',{name:'Explore the guided demo'}).click();const demo=page.locator('.demo-workspace');await demo.locator('[aria-busy="false"]').waitFor();
  const guide=demo.getByRole('complementary',{name:'Guided demonstration'});
  for(let step=1;step<=stop;step++){
   assert.equal(await demo.locator('.field-evidence,.field-connection').count(),0);assert.equal(await demo.getByRole('button',{name:'Download field notes JSON'}).count(),0);
   if(step<stop){await guide.getByRole('button',{name:'Next',exact:true}).click();await guide.getByText(`Step ${step+1} of 5`,{exact:false}).waitFor();}
  }
  if(stop===5){const reference=await download(demo,'Download certificate JSON','demo-reference');assert.equal(reference.fingerprint,baseline.fingerprint);await guide.getByRole('button',{name:'Restart demo'}).click();await guide.getByText('Step 1 of 5',{exact:false}).waitFor();}
  await guide.getByRole('button',{name:'Exit demo',exact:true}).click();assert.deepEqual(await fieldExport(`after-exit-${stop}`),notes);
 }
 await live.getByRole('button',{name:'Explore the guided demo'}).click();const guide=page.locator('.demo-guide');await guide.waitFor();for(let i=2;i<=5;i++){await guide.getByRole('button',{name:'Next',exact:true}).click();await guide.getByText(`Step ${i} of 5`,{exact:false}).waitFor();}await guide.getByRole('button',{name:'Explore independently'}).click();assert.deepEqual(await fieldExport('after-completion'),notes);
 for(const width of [390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});await field.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await field.screenshot({path:`${dir}/summary-${width}.png`});
  await open();await field.locator('details').evaluateAll(ds=>ds.forEach(d=>d.open=true));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await field.screenshot({path:`${dir}/expanded-${width}.png`});
  await field.locator('details').evaluateAll(ds=>ds.forEach(d=>d.open=false));
 }
 await field.getByRole('button',{name:'Clear field information',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Keep field information');await page.keyboard.press('Enter');assert.deepEqual(await fieldExport('after-cancel'),notes);
 await field.getByRole('button',{name:'Clear field information',exact:true}).click();await field.getByRole('button',{name:'Confirm clear field information',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Clear field information');assert.ok((await fieldExport('cleared')).fields.every(f=>f.status==='unknown'));
 await open();await field.getByLabel('Soil pH',{exact:true}).fill('0');await field.getByLabel('Source classification · Soil pH',{exact:true}).selectOption('Farmer-reported');assert.equal((await fieldExport('reentered')).fields[0].value,0);
 assert.deepEqual(await cert('after-clear-reentry'),before);
 await live.getByRole('button',{name:'Reset assumptions'}).click();await ready();assert.deepEqual(await cert('default-after'),baseline);
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);await page.reload();await ready();assert.ok((await fieldExport('after-refresh')).fields.every(f=>f.status==='unknown'));
 assert.ok(requests.every(r=>r.method==='GET'));assert.ok(requests.every(r=>r.url.startsWith(base)));assert.deepEqual(errors,[]);
 await writeFile(`${dir}/result.json`,JSON.stringify({allFields:true,provenance:true,statePersistence:true,demoIsolation:true,clearAndReenter:true,certificateUnchanged:true,noStorageOrUploads:true,widths:[390,768,1024,1440],errors},null,2));console.log('Field evidence: validation, provenance, navigation, all demo exits/restart/completion, keyboard, responsive and certificate isolation passed.');
}catch(e){await page.screenshot({path:`${dir}/failure.png`,fullPage:true});throw e;}finally{await browser.close();}
