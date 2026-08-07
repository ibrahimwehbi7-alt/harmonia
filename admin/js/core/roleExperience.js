(function () {
  "use strict";

  const EXPERIENCE = {
    VIEWER: {
      name: "member",
      landing: "member",
      allowed: []
    },
    TEAM_MEMBER: {
      name: "team",
      landing: "dashboard",
      allowed: ["dashboard", "projects", "work", "events", "notes", "files", "messages", "availability", "project-workspace"]
    },
    ADMIN: {
      name: "admin",
      landing: "dashboard",
      allowed: ["dashboard", "homepage", "about", "connect", "projects", "work", "events", "notes", "files", "gallery", "partners", "messages", "finance", "analytics", "marketing", "users", "availability", "project-workspace"]
    },
    SUPER_ADMIN: {
      name: "owner",
      landing: "dashboard",
      allowed: ["dashboard", "homepage", "about", "connect", "projects", "work", "events", "notes", "files", "gallery", "partners", "messages", "finance", "analytics", "marketing", "users", "audience", "availability", "project-workspace"]
    }
  };

  let active = EXPERIENCE.VIEWER;
  let activeRole = "VIEWER";

  function user() {
    return window.HarmoniaAuth?.getCurrentUser?.() || null;
  }

  function role() {
    return String(user()?.role || "VIEWER").toUpperCase();
  }

  function canAccess(pageId) {
    return active.allowed.includes(pageId);
  }

  function hideUnavailableNavigation() {
    document.querySelectorAll(".nav-button[data-page]").forEach(button => {
      const permitted = canAccess(button.dataset.page);
      button.hidden = !permitted;
      button.setAttribute("aria-hidden", String(!permitted));
    });
  }

  function setBranding() {
    const title = document.querySelector(".sidebar-brand h1, .admin-brand h1, .brand h1");
    const eyebrow = document.querySelector(".sidebar-brand .eyebrow, .admin-brand .eyebrow, .brand .eyebrow");
    if (active.name === "team") {
      if (title) title.textContent = "Team Workspace";
      if (eyebrow) eyebrow.textContent = "Harmonia";
    } else if (active.name === "owner") {
      if (title) title.textContent = "Command Center";
      if (eyebrow) eyebrow.textContent = "Harmonia Owner";
    } else {
      if (title) title.textContent = "Harmonia HQ";
    }
  }

  function addExperienceHeader() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;
    dashboard.querySelector("[data-role-experience-header]")?.remove();

    const wrapper = document.createElement("section");
    wrapper.dataset.roleExperienceHeader = "true";
    wrapper.className = `role-experience-header role-experience-${active.name}`;

    if (active.name === "team") {
      wrapper.innerHTML = `
        <p class="eyebrow">Team Workspace</p>
        <h2>Welcome back, ${escapeHtml(user()?.firstName || "team member")}</h2>
        <p>Focus on the work, events, and conversations connected to your responsibilities.</p>
        <div class="role-experience-actions">
          <button type="button" class="primary-button" data-page="work">Open my work</button>
          <button type="button" class="secondary-button" data-page="events">View events</button>
        </div>`;
      dashboard.classList.add("team-dashboard");
      dashboard.classList.remove("owner-dashboard");
    } else if (active.name === "owner") {
      wrapper.innerHTML = `
        <p class="eyebrow">Owner Command Center</p>
        <h2>Organization-wide visibility</h2>
        <p>Manage people, communications, public content, operations, and organizational performance from one place.</p>
        <div class="role-experience-actions">
          <button type="button" class="primary-button" data-page="audience">People & Audience</button>
          <button type="button" class="secondary-button" data-page="users">Users & Access</button>
        </div>`;
      dashboard.classList.add("owner-dashboard");
      dashboard.classList.remove("team-dashboard");
    } else {
      dashboard.classList.remove("team-dashboard", "owner-dashboard");
      return;
    }

    dashboard.prepend(wrapper);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function enforceCurrentPage() {
    const requested = window.location.hash.replace("#", "").trim() || active.landing;
    if (!canAccess(requested)) {
      window.history.replaceState(null, "", `#${active.landing}`);
      window.openAdminPage?.(active.landing, { updateHash: false });
    }
  }

  function apply() {
    activeRole = role();
    active = EXPERIENCE[activeRole] || EXPERIENCE.VIEWER;

    if (active.name === "member") {
      window.location.replace("/?member=1");
      return false;
    }

    document.body.dataset.harmoniaExperience = active.name;
    document.body.dataset.harmoniaRole = activeRole;
    hideUnavailableNavigation();
    setBranding();
    addExperienceHeader();
    enforceCurrentPage();
    document.dispatchEvent(new CustomEvent("harmonia:experience-ready", {
      detail: { role: activeRole, experience: active.name, landing: active.landing }
    }));
    return true;
  }

  document.addEventListener("harmonia:admin-ready", apply);
  document.addEventListener("harmonia:authenticated", () => setTimeout(apply, 0));
  window.addEventListener("hashchange", () => {
    if (active.name !== "member") enforceCurrentPage();
  });

  window.HarmoniaRoleExperience = {
    apply,
    canAccess,
    getRole: () => activeRole,
    getExperience: () => active.name,
    getLandingPage: () => active.landing
  };

  console.log("✅ Harmonia Role Experience Loaded");
})();
