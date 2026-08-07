(function(){'use strict';
 const allowedAdmin=['dashboard','homepage','about','connect','projects','work','events','notes','files','gallery','partners','messages','finance','analytics','marketing','users','availability','workforce','engagement','intelligence','project-workspace'];
 const allowedOwner=[...allowedAdmin,'audience'];
 let role='VIEWER';
 function sync(){role=String(window.HarmoniaAuth?.getCurrentUser?.()?.role||document.documentElement.dataset.harmoniaRole||'VIEWER').toUpperCase();document.body.dataset.harmoniaRole=role;document.querySelectorAll('.nav-button[data-page]').forEach(b=>{const ok=(role==='SUPER_ADMIN'?allowedOwner:allowedAdmin).includes(b.dataset.page);b.hidden=!ok});return true}
 function canAccess(page){return (role==='SUPER_ADMIN'?allowedOwner:allowedAdmin).includes(page)}
 document.addEventListener('harmonia:admin-ready',sync);document.addEventListener('harmonia:authenticated',sync);
 window.HarmoniaRoleExperience={apply:sync,canAccess,getRole:()=>role,getExperience:()=>role==='SUPER_ADMIN'?'owner':'admin',getLandingPage:()=> 'dashboard'};
})();
