(function(){
"use strict";
function user(){return window.HarmoniaIdentity?.getCurrentUser?.()||null;}
function role(){return window.HarmoniaIdentity?.roleOf?.(user())||"VIEWER";}
function localPreview(){return Boolean(window.HarmoniaIdentity?.isLocalPreview?.());}
function apply(){
  if(localPreview()){
    document.documentElement.classList.remove("harmonia-gating","workspace-pending");
    document.body.hidden=false;
    document.body.style.visibility="visible";
    document.body.dataset.harmoniaRole="SUPER_ADMIN";
    document.body.dataset.harmoniaExperience="owner-preview";
    document.getElementById("workspacePreviewLinks")?.removeAttribute("hidden");
    document.querySelector('[data-page="audience"]')?.removeAttribute("hidden");
    document.querySelector('[data-page="availability"]')?.removeAttribute("hidden");
    return true;
  }
  const r=role();
  if(r!=="ADMIN"&&r!=="SUPER_ADMIN"){
    location.replace(window.HarmoniaIdentity?.destination?.(r)||"/account/");
    return false;
  }
  document.documentElement.classList.remove("harmonia-gating","workspace-pending");
  document.body.hidden=false;
  document.body.style.visibility="visible";
  document.body.dataset.harmoniaRole=r;
  document.body.dataset.harmoniaExperience=r==="SUPER_ADMIN"?"owner":"admin";
  document.getElementById("workspacePreviewLinks")?.toggleAttribute("hidden",r!=="SUPER_ADMIN");
  document.querySelector('[data-page="audience"]')?.toggleAttribute("hidden",r!=="SUPER_ADMIN");
  document.querySelector('[data-page="availability"]')?.removeAttribute("hidden");
  return true;
}
document.addEventListener("harmonia:authenticated",apply);
document.addEventListener("harmonia:admin-ready",apply);
document.addEventListener("harmonia:identity-changed",e=>{if(e.detail?.authenticated)apply();});
window.HarmoniaRoleExperience={apply,getRole:role,getExperience:()=>localPreview()?"owner-preview":(role()==="SUPER_ADMIN"?"owner":"admin"),getLandingPage:()=>"dashboard",canAccess:()=>true};
})();
