(function(){
"use strict";
console.log('App Loaded');
let started=false,startPromise=null;
const initializers=['initializeDashboard','initializeEventModal','initializeEventsPage','initializeProjectModal','initializeProjectsPage','initializeProjectWorkspace','initializeNotesPage','initializeNoteModal','initializeFilesPage','initializeFileModal','initializeGalleryPage','initializePartnersPage','initializeMessagesPage','initializeFinancePage','initializeAnalyticsPage','initializeMarketingPage','initializeUsersPage'];
async function call(name){if(typeof window[name]==='function'){try{await window[name]();}catch(e){console.error(`${name} failed:`,e);}}}
async function loadLiveData(){const jobs=[];for(const manager of [window.ProjectManager,window.HarmoniaWork,window.HarmoniaEvents,window.HarmoniaNotes,window.HarmoniaFiles,window.HarmoniaPartners]){const fn=manager?.load||manager?.loadProjects||manager?.loadWork;if(typeof fn==='function')jobs.push(Promise.resolve(fn.call(manager,{force:true})).catch(e=>{console.error('Live data load failed:',e);return null;}));}await Promise.all(jobs);}
async function initializeFeatures(){if(started)return;started=true;await loadLiveData();for(const name of initializers)await call(name);await call('initializeWorkPage');window.initializeRouter?.();document.dispatchEvent(new CustomEvent('harmonia:admin-ready'));console.log('✅ Harmonia Version 1 Admin Ready');}
async function start(){if(startPromise)return startPromise;startPromise=(async()=>{if(!window.HarmoniaAuth)throw new Error('Authentication runtime unavailable.');const ok=await window.HarmoniaAuth.initialize();if(ok)await initializeFeatures();})();try{return await startPromise;}finally{startPromise=null;}}
document.addEventListener('harmonia:authenticated',()=>initializeFeatures().catch(console.error));document.addEventListener('harmonia:logout',()=>{started=false;});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>start().catch(console.error),{once:true});else start().catch(console.error);window.initializeHarmoniaAdmin=initializeFeatures;
})();
