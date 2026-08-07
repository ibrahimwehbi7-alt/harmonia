(function () {
  "use strict";

  const SESSION_KEY = "harmonia_session";
  const LEGACY_SESSION_KEYS = ["harmonia_session_v2", "harmonia_session_v3"];
  const LEGACY_TOKEN_KEYS = ["harmonia_access_token", "accessToken", "token"];
  const API = String(window.HARMONIA_CONFIG?.apiBaseUrl || "https://harmonia-production-720f.up.railway.app").replace(/\/+$/, "");
  let currentUser = null;
  let bootPromise = null;

  function parse(raw){ try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
  function readStore(store) {
    let value = parse(store.getItem(SESSION_KEY));
    if (value?.accessToken) return value;
    for (const key of LEGACY_SESSION_KEYS) {
      value = parse(store.getItem(key));
      const token = value?.accessToken || value?.token;
      if (token) return { accessToken: token, user: value.user || null, savedAt: value.savedAt || null };
    }
    for (const key of LEGACY_TOKEN_KEYS) {
      const token = store.getItem(key);
      if (token) return { accessToken: token, user: null, savedAt: null };
    }
    return null;
  }
  function session(){ return readStore(localStorage) || readStore(sessionStorage); }
  function getToken(){ return session()?.accessToken || ""; }
  function rememberMode(){ return Boolean(localStorage.getItem(SESSION_KEY)); }

  function cleanupLegacy(){
    for (const store of [localStorage, sessionStorage]) {
      for (const key of [...LEGACY_SESSION_KEYS, ...LEGACY_TOKEN_KEYS]) store.removeItem(key);
    }
  }
  function writeSession(accessToken, user, remember=true){
    localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY);
    cleanupLegacy();
    if (!accessToken) return null;
    const value={accessToken,user:user||null,savedAt:new Date().toISOString()};
    (remember?localStorage:sessionStorage).setItem(SESSION_KEY, JSON.stringify(value));
    currentUser=user||null;
    document.dispatchEvent(new CustomEvent("harmonia:identity-changed",{detail:{authenticated:true,user:currentUser}}));
    return value;
  }
  function updateUser(user){
    const s=session(); currentUser=user||null; if(!s)return null;
    return writeSession(s.accessToken,currentUser,rememberMode());
  }
  function clear(){
    localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); cleanupLegacy();
    currentUser=null; bootPromise=null;
    document.dispatchEvent(new CustomEvent("harmonia:identity-changed",{detail:{authenticated:false,user:null}}));
  }

  async function request(path, options={}){
    const headers={Accept:"application/json",...(options.headers||{})};
    if(options.body && !(options.body instanceof FormData)) headers["Content-Type"]="application/json";
    const token=getToken(); if(token && options.auth!==false) headers.Authorization=`Bearer ${token}`;
    const response=await fetch(`${API}${path}`,{...options,headers,credentials:"omit"});
    const text=await response.text(); let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
    if(!response.ok){ if(response.status===401 && options.auth!==false) clear(); const raw=data?.message?.message||data?.message||data?.error||`Request failed (${response.status})`; throw new Error(Array.isArray(raw)?raw.join(" "):String(raw)); }
    return data;
  }

  async function fetchMe(){
    if(!getToken()) return null;
    try { return await request("/users/me"); }
    catch(first){
      if(/401|unauthor/i.test(String(first?.message||""))) throw first;
      return await request("/auth/me");
    }
  }
  function normalizeRole(value){
    const role=String(typeof value==="string"?value:value?.role||"").trim().toUpperCase();
    return ["VIEWER","TEAM_MEMBER","ADMIN","SUPER_ADMIN"].includes(role)?role:"";
  }
  function requireRole(user){
    const role=normalizeRole(user);
    if(!role) throw new Error("Your account authenticated, but no valid Harmonia role was returned. Please contact an administrator.");
    return role;
  }
  function destination(value){
    const role=requireRole(value);
    if(role==="SUPER_ADMIN"||role==="ADMIN") return "/admin/#dashboard";
    if(role==="TEAM_MEMBER") return "/team/";
    return "/member/";
  }

  async function boot(force=false){
    if(force) bootPromise=null;
    if(bootPromise) return bootPromise;
    bootPromise=(async()=>{
      if(!getToken()){ currentUser=null; return null; }
      try{
        let user=session()?.user||null;
        if(!user || !normalizeRole(user) || force) user=await fetchMe();
        requireRole(user);
        updateUser(user);
        return user;
      }catch(err){ clear(); throw err; }
    })();
    return bootPromise;
  }

  async function login(email,password,remember=true){
    const result=await request("/auth/login",{method:"POST",auth:false,body:JSON.stringify({email:String(email||"").trim(),password:String(password||"")})});
    const token=result?.accessToken||result?.access_token||result?.token||"";
    if(!token) throw new Error("The server did not return an access token.");
    let user=result?.user||null;
    writeSession(token,user,remember);
    if(!normalizeRole(user)) user=await fetchMe();
    requireRole(user);
    updateUser(user);
    return user;
  }
  async function register(payload,remember=true){
    const result=await request("/auth/register",{method:"POST",auth:false,body:JSON.stringify(payload)});
    const token=result?.accessToken||result?.access_token||result?.token||"";
    if(!token) throw new Error("The server did not return an access token.");
    let user=result?.user||null;
    writeSession(token,user,remember);
    if(!normalizeRole(user)) user=await fetchMe();
    requireRole(user);
    updateUser(user);
    return user;
  }

  function isLocalPreview(){
    const host=String(location.hostname||"").toLowerCase();
    return new URLSearchParams(location.search).has("preview") && (host==="localhost"||host==="127.0.0.1"||host==="::1");
  }
  function reveal(){
    document.documentElement.classList.remove("workspace-pending","harmonia-gating","harmonia-auth-pending","harmonia-admin-pending");
    document.documentElement.classList.add("harmonia-auth-ready");
    if(document.body){document.body.hidden=false;document.body.style.visibility="visible";}
  }
  function workspaceRoles(workspace){
    if(Array.isArray(workspace)) return workspace.map(normalizeRole).filter(Boolean);
    if(workspace==="admin") return ["ADMIN","SUPER_ADMIN"];
    if(workspace==="team") return ["TEAM_MEMBER"];
    if(workspace==="member") return ["VIEWER"];
    return [];
  }
  async function guard(workspace,options={}){
    if((options.allowPreview||options.allowLocalPreview) && isLocalPreview()){
      let user=null; try{user=await boot();}catch{}
      reveal(); if(document.body)document.body.dataset.previewMode="true";
      return user||{id:"preview",email:"preview@localhost",firstName:"Preview",role:"SUPER_ADMIN",__preview:true};
    }
    let user;
    try{user=await boot(true);}catch(err){console.error("Harmonia identity boot failed",err);}
    if(!user){ const next=encodeURIComponent(location.pathname+location.search+location.hash); location.replace(`/account/?next=${next}`); return null; }
    const role=requireRole(user); const allowed=workspaceRoles(workspace);
    if(allowed.length && !allowed.includes(role)){ location.replace(destination(role)); return null; }
    document.documentElement.dataset.harmoniaRole=role;
    reveal();
    document.dispatchEvent(new CustomEvent("harmonia:identity-ready",{detail:{user,role,workspace}}));
    return user;
  }

  window.HarmoniaIdentity={SESSION_KEY,session,getToken,request,boot,login,register,clear,updateUser,getCurrentUser:()=>currentUser||session()?.user||null,normalizeRole,roleOf:normalizeRole,requireRole,destination,guard,isLocalPreview};
})();
