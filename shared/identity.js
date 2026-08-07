(function () {
  "use strict";

  const SESSION_KEY = "harmonia_session";
  const LEGACY_TOKEN_KEYS = ["harmonia_access_token", "accessToken", "token"];
  const API = String(window.HARMONIA_CONFIG?.apiBaseUrl || "https://harmonia-production-720f.up.railway.app").replace(/\/+$/, "");
  let currentUser = null;
  let bootPromise = null;

  function readStore(store) {
    try {
      const raw = store.getItem(SESSION_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      return value && value.accessToken ? value : null;
    } catch { return null; }
  }

  function session() { return readStore(localStorage) || readStore(sessionStorage); }
  function getToken() { return session()?.accessToken || ""; }
  function isLocalPreview() {
    const host = String(location.hostname || "").toLowerCase();
    return new URLSearchParams(location.search).has("preview") &&
      (host === "localhost" || host === "127.0.0.1" || host === "::1");
  }

  function clearLegacy() {
    for (const key of LEGACY_TOKEN_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }

  function writeSession(accessToken, user, remember) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    clearLegacy();
    if (!accessToken) return;
    const value = { accessToken, user: user || null, savedAt: new Date().toISOString() };
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(value));
    currentUser = user || null;
    document.dispatchEvent(new CustomEvent("harmonia:identity-changed", {
      detail: { authenticated: true, user: currentUser }
    }));
  }

  function updateUser(user) {
    const value = session();
    currentUser = user || null;
    if (!value) return;
    writeSession(value.accessToken, currentUser, Boolean(localStorage.getItem(SESSION_KEY)));
  }

  function clear() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    clearLegacy();
    currentUser = null;
    bootPromise = null;
    document.dispatchEvent(new CustomEvent("harmonia:identity-changed", {
      detail: { authenticated: false, user: null }
    }));
  }

  async function request(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: "omit" });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      if (response.status === 401 && options.auth !== false) clear();
      const raw = data?.message?.message || data?.message || data?.error || `Request failed (${response.status})`;
      throw new Error(Array.isArray(raw) ? raw.join(" ") : String(raw));
    }
    return data;
  }

  async function fetchMe() {
    if (!getToken()) return null;
    try { return await request("/users/me"); }
    catch (first) {
      if (/401|unauthor/i.test(String(first?.message || ""))) throw first;
      return await request("/auth/me");
    }
  }

  async function boot() {
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
      if (!session()?.accessToken) { currentUser = null; return null; }
      try {
        const user = await fetchMe();
        updateUser(user);
        return user;
      } catch {
        clear();
        return null;
      }
    })();
    return bootPromise;
  }

  async function login(email, password, remember = true) {
    const result = await request("/auth/login", {
      method: "POST", auth: false,
      body: JSON.stringify({ email: String(email || "").trim(), password: String(password || "") })
    });
    const token = result?.accessToken || result?.access_token || result?.token || "";
    if (!token) throw new Error("The server did not return an access token.");
    writeSession(token, result.user || null, remember);
    const user = result.user || await fetchMe();
    updateUser(user);
    return user;
  }

  async function register(payload, remember = true) {
    const result = await request("/auth/register", {
      method: "POST", auth: false, body: JSON.stringify(payload)
    });
    const token = result?.accessToken || result?.access_token || result?.token || "";
    if (!token) throw new Error("The server did not return an access token.");
    writeSession(token, result.user || null, remember);
    const user = result.user || await fetchMe();
    updateUser(user);
    return user;
  }

  function roleOf(user = currentUser || session()?.user) {
    return String(user?.role || "VIEWER").toUpperCase();
  }
  function destination(role = roleOf()) {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return "/admin/#dashboard";
    if (role === "TEAM_MEMBER") return "/team/";
    return "/member/";
  }
  function reveal() {
    document.documentElement.classList.remove("workspace-pending", "harmonia-gating");
    if (document.body) {
      document.body.hidden = false;
      document.body.style.visibility = "visible";
    }
  }

  async function guard(allowedRoles, options = {}) {
    if (options.allowLocalPreview !== false && isLocalPreview()) {
      const user = await boot();
      reveal();
      if (document.body) document.body.dataset.previewMode = "true";
      return user || { id: "preview", email: "preview@localhost", firstName: "Preview", role: "SUPER_ADMIN", __preview: true };
    }

    const user = await boot();
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`/account/?next=${next}`);
      return null;
    }
    const role = roleOf(user);
    if (!allowedRoles.includes(role)) {
      location.replace(destination(role));
      return null;
    }
    reveal();
    return user;
  }

  window.HarmoniaIdentity = {
    SESSION_KEY, session, getToken, request, boot, login, register, clear,
    updateUser, getCurrentUser: () => currentUser || session()?.user || null,
    roleOf, destination, guard, isLocalPreview
  };
})();
