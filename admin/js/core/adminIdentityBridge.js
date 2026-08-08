(function(){
  "use strict";

  let currentUser = null;

  function identity(){
    return window.HarmoniaIdentity || null;
  }

  function ready(user){
    if (!user) return;
    currentUser = user;
    const role = identity()?.requireRole?.(user) || user?.effectiveRole || user?.role || "";
    document.documentElement.dataset.harmoniaRole = role;
    document.documentElement.classList.remove("harmonia-admin-pending", "harmonia-gating", "harmonia-auth-pending");
    document.documentElement.classList.add("harmonia-admin-ready", "harmonia-auth-ready");
    if (document.body) document.body.style.visibility = "visible";
    document.dispatchEvent(new CustomEvent("harmonia:admin-ready", { detail: { user } }));
  }

  // Compatibility bridge: EXTEND HarmoniaAuth. Never replace it.
  Object.assign(window.HarmoniaAuth || (window.HarmoniaAuth = {}), {
    getCurrentUser: () => currentUser || identity()?.getCurrentUser?.() || null,
    isAuthenticated: () => Boolean(identity()?.getToken?.()),
    logout: () => {
      try { identity()?.clear?.(); } finally {
        currentUser = null;
        document.dispatchEvent(new CustomEvent("harmonia:logout"));
        location.replace("/account/");
      }
    },
    showLogin: () => location.assign(
      "/account/?next=" + encodeURIComponent(location.pathname + location.search + location.hash)
    )
  });

  (async () => {
    try {
      if (!identity()) throw new Error("HarmoniaIdentity is unavailable.");
      const user = await identity().guard("admin", { allowPreview: true, allowLocalPreview: true });
      if (user) ready(user);
    } catch (error) {
      console.error("Admin identity bridge failed", error);
      identity()?.clear?.();
      location.replace("/account/?next=" + encodeURIComponent("/admin/#dashboard"));
    }
  })();
})();
