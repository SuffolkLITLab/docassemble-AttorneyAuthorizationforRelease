const path=require('node:path');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const alkiln=process.env.ALKILN_PATH;
const {Then}=require(path.join(alkiln,'node_modules/@cucumber/cucumber'));
const scope=require(path.join(alkiln,'lib/scope'));
// Docassemble now uses div.da-button-set instead of fieldset for these controls.
// Restrict the compatibility change to selectors; keep ALKiln navigation/assertions.
scope.continue_button_selector='.da-field-buttons button[type="submit"].btn-primary';
scope.signature_selector='.da-field-buttons .dasigsave';
// New labels omit aria-checked. Read the associated native input instead.
scope.setCheckbox=async (_scope,{label,answer})=>{
 await label.evaluate((el,want)=>{
  const input=el.control||document.getElementById(el.htmlFor);
  if(!input)throw Error('Checkbox label has no associated input');
  if(input.checked!==want)el.click();
 },String(answer).toLowerCase()==='true');
};
const clean=s=>s.replace(/\s+/g,' ').trim();
Then('the downloaded PDF {string} should contain {string}',async(file,expected)=>{
 const pdf=path.join(scope.paths.scenario,file);
 const text=clean(execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'}));
 if(!text.includes(clean(expected)))throw Error('Missing PDF text: '+expected);
});
Then('the downloaded PDF {string} should not contain {string}',async(file,unwanted)=>{
 const text=clean(execFileSync('pdftotext',[path.join(scope.paths.scenario,file),'-'],{encoding:'utf8'}));
 if(text.includes(clean(unwanted)))throw Error('Unexpected PDF text: '+unwanted);
});

// Fail promptly on AssemblyLine's custom error screen instead of repeatedly pressing Next.
const examine=scope.examinePageID;
scope.examinePageID=async(...args)=>{
 const result=await examine(...args);
 if(result.id==='custom-error-action')throw Error('Interview runtime error: '+await scope.page.$eval('#daquestion',e=>e.innerText));
 return result;
};
const {When}=require(path.join(alkiln,'node_modules/@cucumber/cucumber'));
When('I follow the review link containing {string}',{timeout:90000},async(text)=>{
 const links=await scope.page.$$('#daquestion a');
 for(const link of links){
  if((await link.evaluate(e=>e.closest('.da-review')?.innerText || e.innerText)).includes(text)){
   await scope.tapElementAndNavigate(scope,{elem:link});return;
  }
 }
 throw Error('No review link containing: '+text);
});

// Docassemble review/Resume can change the screen without changing its URL.
// Preserve ALKiln's error handlers and also recognize a changed question ID.
scope.wait_until_continued=async (state,{url='',id='',post_nav_handlers=null})=>{
 const handlers=post_nav_handlers ?? [state.throw_on_system_error,state.throw_on_invalid_answers,state.throw_on_non_navigation_timeout,state.throw_on_non_navigation_catchall];
 state.throw_if_missing_required_post_nav_handlers(state,{handlers});
 const deadline=Date.now()+state.timeout;
 let error_data,navigated=false,timed_out=false;
 while(true){
  let current;
  try {
   error_data=await state.checkForErrors(state);
   current=await state.get_page_id(state);
  } catch(error) {
   if (!/Execution context was destroyed|Cannot find context/.test(error.message)) throw error;
   if(Date.now()>=deadline) throw error;
   await new Promise(resolve=>setTimeout(resolve,100));
   continue;
  }
  navigated=state.page.url()!==url || (current && id && current!==id);
  if(navigated || !error_data.ok)break;
  if(Date.now()>=deadline){timed_out=true;break;}
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 state.navigated=navigated;
 await new Promise(resolve=>setTimeout(resolve,350));
 await state.page.waitForSelector("#daquestion");
 await state.log_and_update_if_new_page_id(state);
 if(!error_data.ok || timed_out){
  for(const handler of handlers)await handler(state,{id,error_data,timed_out});
 }
 return {error_data,navigated};
};
require(path.join(alkiln,'node_modules/@cucumber/cucumber')).setDefaultTimeout(90000);

When('I use a narrow phone viewport', async () => {
  await scope.page.setViewport({width:390,height:844,deviceScaleFactor:1});
});
Then('the interview fits the phone width', async () => {
  // The local developer server injects unwrapped debug IDs; hide only that
  // diagnostic paragraph, which is absent from the production user interface.
  await scope.page.evaluate(()=>{
   for(const p of document.querySelectorAll("#daquestion p")) {
    if(p.querySelector("code") && p.textContent.includes("Version:")) p.style.display="none";
   }
  });
  const sizes=await scope.page.evaluate(()=>({content:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  if(sizes.content>sizes.viewport+1)throw Error('Horizontal overflow: '+JSON.stringify(sizes));
});

When("I download a fresh copy of {string}", async (file)=>{
 const target=path.join(scope.paths.scenario,file);
 if(fs.existsSync(target))fs.unlinkSync(target);
 await scope.steps.download(scope,file);
});

// A full-page POST can destroy a context while ALKiln reads validation/visibility.
// Retry only these read-only probes; never retry a click or field mutation.
for (const name of ['checkForErrors','get_page_id','examinePageID','waitForShowIf','log_and_update_if_new_page_id']) {
 const original=scope[name];
 if(!original)continue;
 scope[name]=async(...args)=>{
  for(let attempt=0;;attempt++){
   try{return await original(...args);}
   catch(error){
    if(attempt>=20 || !/Execution context was destroyed|Cannot find context|detached Frame/.test(error.message))throw error;
    await new Promise(resolve=>setTimeout(resolve,100));
   }
  }
 };
}

// Await the POST's new document before inspecting the next screen. Existing
// validation markers can otherwise win ALKiln's navigation race prematurely.
scope.tapElementAndNavigate=async(state,{elem,post_nav_handlers=null})=>{
 await state.guard_against_missing_tap_element(state,{elem});
 const id=await state.get_page_id(state);
 const url=state.page.url();
 const navigation=state.page.waitForNavigation({waitUntil:'domcontentloaded',timeout:5000}).catch(error=>{
  if(error.name==='TimeoutError')return null;
  throw error;
 });
 await elem.evaluate(el=>el.click());
 await navigation;
 const result=await state.wait_until_continued(state,{url,id,post_nav_handlers});
 await state.afterStep(state,{navigated:result.navigated,waitForTimeout:200});
 return result.error_data;
};
