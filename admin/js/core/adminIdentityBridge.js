(function(){
  "use strict";
  let currentUser=null;
  function ready(user){
    currentUser=user;
    document.documentElement.dataset.harmoniaRole=window.HarmoniaIdentity.requireRole(user);
    document.documentElement.classList.remove("harmonia-admin-pending","harmonia-gating");
    document.documentElement.classList.add("harmonia-admin-ready");
    document.dispatchEvent(new CustomEvent("harmonia:authenticated",{detail:{user}}));
    document.dispatchEvent(new CustomEvent("harmonia:admin-ready",{detail:{user}}));
  }
  window.HarmoniaAuth={
    getCurrentUser:()=>currentUser||window.HarmoniaIdentity.getCurrentUser(),
    isAuthenticated:()=>!!(currentUser||window.HarmoniaIdentity.getCurrentUser()),
    logout:()=>{window.HarmoniaIdentity.clear();location.replace("/account/");},
    showLogin:()=>location.assign("/account/?next="+encodeURIComponent(location.pathname+location.search+location.hash))
  };
  (async()=>{
    try{
      const user=await window.HarmoniaIdentity.guard("admin",{allowPreview:true,allowLocalPreview:true});
      if(user)ready(user);
    }catch(err){console.error("Admin identity bridge failed",err);window.HarmoniaIdentity.clear();location.replace("/account/?next="+encodeURIComponent("/admin/#dashboard"));}
  })();
})();
