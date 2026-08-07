(function(){
"use strict";
let initialized=false;
function I(){return window.HarmoniaIdentity;}
async function initialize(){if(initialized)return Boolean(I()?.getCurrentUser?.());initialized=true;const user=await I().boot();document.dispatchEvent(new CustomEvent("harmonia:auth-initialized",{detail:{authenticated:Boolean(user),user}}));if(user)document.dispatchEvent(new CustomEvent("harmonia:authenticated",{detail:{user}}));return Boolean(user);}
async function login(email,password,remember=true){const user=await I().login(email,password,remember);document.dispatchEvent(new CustomEvent("harmonia:authenticated",{detail:{user}}));return user;}
function logout(){I()?.clear();location.replace("/account/");}
function showLogin(message){const next=encodeURIComponent(location.pathname+location.hash);location.assign("/account/?next="+next+(message?"&message="+encodeURIComponent(message):""));}
window.HarmoniaAuth={initialize,login,logout,showLogin,hideLogin:()=>{},validateSession:async()=>Boolean(await I().boot()),getCurrentUser:()=>I()?.getCurrentUser?.()||null,isAuthenticated:()=>Boolean(I()?.getToken?.())};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});else initialize();
})();
