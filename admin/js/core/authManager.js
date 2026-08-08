(function(){
  "use strict";

  let initPromise = null;

  function identity(){
    return window.HarmoniaIdentity || null;
  }

  async function initialize(force = false){
    if (!identity()) throw new Error("HarmoniaIdentity is unavailable.");
    if (force) initPromise = null;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const user = await identity().boot(Boolean(force));
      document.dispatchEvent(new CustomEvent("harmonia:auth-initialized", {
        detail: { authenticated: Boolean(user), user }
      }));
      if (user) {
        document.dispatchEvent(new CustomEvent("harmonia:authenticated", { detail: { user } }));
      }
      return user || null;
    })();

    try {
      return await initPromise;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  }

  async function login(email, password, remember = true){
    if (!identity()) throw new Error("HarmoniaIdentity is unavailable.");
    const user = await identity().login(email, password, remember);
    initPromise = Promise.resolve(user);
    document.dispatchEvent(new CustomEvent("harmonia:authenticated", { detail: { user } }));
    return user;
  }

  function logout(){
    try { identity()?.clear?.(); } finally {
      initPromise = null;
      document.dispatchEvent(new CustomEvent("harmonia:logout"));
      location.replace("/account/");
    }
  }

  function showLogin(message){
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.assign("/account/?next=" + next + (message ? "&message=" + encodeURIComponent(message) : ""));
  }

  Object.assign(window.HarmoniaAuth || (window.HarmoniaAuth = {}), {
    initialize,
    login,
    logout,
    showLogin,
    hideLogin: () => {},
    validateSession: async () => Boolean(await initialize(true)),
    getCurrentUser: () => identity()?.getCurrentUser?.() || null,
    isAuthenticated: () => Boolean(identity()?.getToken?.())
  });
})();
