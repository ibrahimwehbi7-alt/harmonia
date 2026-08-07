(function(){
  "use strict";
  const I=window.HarmoniaIdentity;
  const status=document.getElementById("status");
  const login=document.getElementById("loginForm");
  const register=document.getElementById("registerForm");
  const signInTab=document.getElementById("signInTab");
  const createTab=document.getElementById("createTab");
  const query=new URLSearchParams(location.search);

  function msg(text,error=false){status.textContent=text||"";status.classList.toggle("error",error);}
  function show(which){const isLogin=which==="login";login.hidden=!isLogin;register.hidden=isLogin;signInTab.classList.toggle("active",isLogin);createTab.classList.toggle("active",!isLogin);msg("");}
  function requestedNext(){const n=query.get("next")||"";return n.startsWith("/")&&!n.startsWith("//")?n:"";}
  function route(user){
    const role=I.requireRole(user);
    const next=requestedNext();
    if(next.startsWith("/admin/") && !["ADMIN","SUPER_ADMIN"].includes(role)) return I.destination(role);
    if(next.startsWith("/team/") && role!=="TEAM_MEMBER") return I.destination(role);
    if(next.startsWith("/member/") && role!=="VIEWER") return I.destination(role);
    return next||I.destination(role);
  }
  signInTab.onclick=()=>show("login"); createTab.onclick=()=>show("register");
  login.onsubmit=async e=>{e.preventDefault();msg("Signing in…");try{const user=await I.login(login.email.value,login.password.value,login.remember.checked);const target=route(user);msg(`Opening ${I.requireRole(user).replaceAll("_"," ").toLowerCase()} workspace…`);location.replace(target);}catch(err){msg(err.message,true);}};
  register.onsubmit=async e=>{e.preventDefault();msg("Creating account…");try{const user=await I.register({firstName:register.firstName.value,lastName:register.lastName.value,email:register.email.value,password:register.password.value},true);location.replace(I.destination(user));}catch(err){msg(err.message,true);}};
  (async()=>{try{const user=await I.boot(true);if(user&&!query.has("preview"))location.replace(route(user));}catch(err){I.clear();}})();
})();
