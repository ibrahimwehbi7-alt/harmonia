(function(){
"use strict";
const I=window.HarmoniaIdentity;
if(!I) throw new Error("Harmonia Identity is unavailable.");
window.HarmoniaWorkspaceAuth={
  token:I.getToken,
  setToken:(value,remember=true)=>{ const user=I.getCurrentUser(); const store=remember?localStorage:sessionStorage; localStorage.removeItem(I.SESSION_KEY);sessionStorage.removeItem(I.SESSION_KEY);store.setItem(I.SESSION_KEY,JSON.stringify({accessToken:value,user:user||null,savedAt:new Date().toISOString()})); },
  clear:I.clear,
  request:I.request,
  destination:I.destination,
  me:I.boot,
  requireRoles:(roles,options)=>I.guard(roles,options)
};
})();
