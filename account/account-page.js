(async function(){
"use strict";
const I=window.HarmoniaIdentity;
const q=new URLSearchParams(location.search);
const requested=q.get("next")||"";
const tabs=[...document.querySelectorAll("[data-tab]")];
const loginForm=document.getElementById("loginForm");
const registerForm=document.getElementById("registerForm");
const message=document.getElementById("message");
function show(name){tabs.forEach(b=>b.classList.toggle("active",b.dataset.tab===name));loginForm.hidden=name!=="login";registerForm.hidden=name!=="register";message.textContent="";}
function safeNext(user){
  if(!requested || !requested.startsWith("/") || requested.startsWith("//")) return I.destination(user);
  const r=I.roleOf(user);
  if(requested.startsWith("/admin/") && r!=="ADMIN" && r!=="SUPER_ADMIN") return I.destination(r);
  if(requested.startsWith("/team/") && !["TEAM_MEMBER","ADMIN","SUPER_ADMIN"].includes(r)) return I.destination(r);
  return requested;
}
tabs.forEach(b=>b.addEventListener("click",()=>show(b.dataset.tab)));
const existing=await I.boot();
document.documentElement.classList.remove("workspace-pending");document.body.hidden=false;
if(existing&&!q.has("preview")){location.replace(safeNext(existing));return;}
loginForm.addEventListener("submit",async e=>{e.preventDefault();message.textContent="Signing in…";try{const user=await I.login(loginForm.email.value,loginForm.password.value,loginForm.remember.checked);location.replace(safeNext(user));}catch(err){message.textContent=err.message;}});
registerForm.addEventListener("submit",async e=>{e.preventDefault();message.textContent="Creating account…";try{const user=await I.register({firstName:registerForm.firstName.value,lastName:registerForm.lastName.value,email:registerForm.email.value,password:registerForm.password.value},true);location.replace(I.destination(user));}catch(err){message.textContent=err.message;}});
})();
