(async function(){
const result={};
result.url=location.href;result.api=window.HarmoniaApi?.getBaseUrl?.();result.authenticated=window.HarmoniaAuth?.isAuthenticated?.();result.user=window.HarmoniaAuth?.getCurrentUser?.();
for(const [name,path] of Object.entries({projects:'/projects',tasks:'/tasks',events:`/events?organizationId=${encodeURIComponent(window.HarmoniaApi.getOrganizationId()||'cms9eoh7c0000prxue4fvntqp')}&limit=1`,notes:`/notes?organizationId=${encodeURIComponent(window.HarmoniaApi.getOrganizationId()||'cms9eoh7c0000prxue4fvntqp')}&limit=1`,files:`/files?organizationId=${encodeURIComponent(window.HarmoniaApi.getOrganizationId()||'cms9eoh7c0000prxue4fvntqp')}&limit=1`,partners:`/external-organizations?organizationId=${encodeURIComponent(window.HarmoniaApi.getOrganizationId()||'cms9eoh7c0000prxue4fvntqp')}`})){try{await window.HarmoniaApi.request(path);result[name]='PASS';}catch(e){result[name]=`FAIL: ${e.message}`;}}
console.table(result);return result;
})()
