(function () {
  "use strict";

  const TOKEN_KEY = "harmonia_access_token";
  const API = String(window.HARMONIA_CONFIG?.apiBaseUrl || "").replace(/\/+$/, "");
  let currentUser = null;

  function token() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function saveToken(value, remember = true) {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, value);
  }

  async function request(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (options.body) headers["Content-Type"] = "application/json";
    const accessToken = token();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: "omit" });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      const raw = data?.message || data?.error || `Request failed (${response.status})`;
      throw new Error(Array.isArray(raw) ? raw.join(" ") : String(raw));
    }
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
  }

  function buildModal() {
    if (document.getElementById("harmonia-account-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "harmonia-account-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="harmonia-account-card" role="dialog" aria-modal="true" aria-labelledby="harmonia-account-title">
        <button class="harmonia-account-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">Harmonia Community</p>
        <h2 id="harmonia-account-title">Your account</h2>
        <div class="harmonia-account-tabs" data-account-tabs>
          <button type="button" data-account-tab="login" class="active">Sign in</button>
          <button type="button" data-account-tab="register">Create account</button>
        </div>
        <form id="harmonia-login-form" class="harmonia-account-form">
          <label>Email<input type="email" name="email" autocomplete="email" required></label>
          <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
          <label class="harmonia-account-check"><input type="checkbox" name="remember" checked> Keep me signed in</label>
          <button class="primary-button" type="submit">Sign in</button>
        </form>
        <form id="harmonia-register-form" class="harmonia-account-form" hidden>
          <div class="harmonia-account-name-row">
            <label>First name<input type="text" name="firstName" autocomplete="given-name" required></label>
            <label>Last name<input type="text" name="lastName" autocomplete="family-name" required></label>
          </div>
          <label>Email<input type="email" name="email" autocomplete="email" required></label>
          <label>Password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label>
          <p class="harmonia-account-note">New accounts begin with Viewer access. Harmonia administrators assign additional access internally.</p>
          <button class="primary-button" type="submit">Create account</button>
        </form>
        <div id="harmonia-profile-panel" hidden></div>
        <p id="harmonia-account-message" class="harmonia-account-message" aria-live="polite"></p>
      </section>`;
    document.body.appendChild(overlay);

    overlay.querySelector(".harmonia-account-close").onclick = () => { overlay.hidden = true; };
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.hidden = true; });
    overlay.querySelectorAll("[data-account-tab]").forEach(button => button.onclick = () => showTab(button.dataset.accountTab));
    overlay.querySelector("#harmonia-login-form").addEventListener("submit", login);
    overlay.querySelector("#harmonia-register-form").addEventListener("submit", register);
  }

  function setMessage(message, error = false) {
    const box = document.getElementById("harmonia-account-message");
    if (!box) return;
    box.textContent = message || "";
    box.classList.toggle("error", error);
  }

  function showTab(tab) {
    document.querySelectorAll("[data-account-tab]").forEach(b => b.classList.toggle("active", b.dataset.accountTab === tab));
    document.getElementById("harmonia-login-form").hidden = tab !== "login";
    document.getElementById("harmonia-register-form").hidden = tab !== "register";
    document.getElementById("harmonia-profile-panel").hidden = true;
    document.querySelector("[data-account-tabs]").hidden = false;
    setMessage("");
  }

  function destinationForRole(role) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/#dashboard";
    if (role === "TEAM_MEMBER") return "/admin/#work";
    return "";
  }

  function formatDate(value) {
    if (!value) return "No deadline";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No deadline";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  async function loadMyWork() {
    const container = document.getElementById("harmonia-my-work");
    if (!container || !currentUser) return;
    container.innerHTML = '<p class="harmonia-account-note">Loading your assigned work…</p>';

    try {
      const tasks = await request("/tasks");
      const assigned = (Array.isArray(tasks) ? tasks : []).filter(task =>
        task?.assignedTo?.id === currentUser.id || task?.assignedToId === currentUser.id
      );

      if (!assigned.length) {
        container.innerHTML = `
          <div class="harmonia-my-work-empty">
            <strong>No assigned tasks yet</strong>
            <p>Your assignments will appear here as soon as a Harmonia team member sends you work.</p>
          </div>`;
        return;
      }

      container.innerHTML = `
        <div class="harmonia-my-work-heading">
          <strong>My assigned work</strong>
          <span>${assigned.length} task${assigned.length === 1 ? "" : "s"}</span>
        </div>
        <div class="harmonia-my-work-list">
          ${assigned.map(task => `
            <article class="harmonia-my-work-item">
              <div>
                <strong>${escapeHtml(task.title)}</strong>
                <span>${escapeHtml(task.project?.name || "Harmonia")}</span>
              </div>
              <div class="harmonia-my-work-meta">
                <span>${escapeHtml(String(task.status || "TODO").replaceAll("_", " "))}</span>
                <span>${escapeHtml(formatDate(task.dueDate))}</span>
              </div>
            </article>`).join("")}
        </div>`;
    } catch (error) {
      container.innerHTML = `<p class="harmonia-account-message error">${escapeHtml(error.message)}</p>`;
    }
  }

  function routeAfterLogin() {
    const destination = destinationForRole(currentUser?.role);
    if (!destination) return false;
    setMessage("Opening your Harmonia workspace…");
    window.setTimeout(() => window.location.assign(destination), 250);
    return true;
  }

  function renderProfile() {
    const tabs = document.querySelector("[data-account-tabs]");
    const loginForm = document.getElementById("harmonia-login-form");
    const registerForm = document.getElementById("harmonia-register-form");
    const panel = document.getElementById("harmonia-profile-panel");
    tabs.hidden = true;
    loginForm.hidden = true;
    registerForm.hidden = true;
    panel.hidden = false;
    panel.innerHTML = `
      <div class="harmonia-account-profile-head">
        <div><strong>${escapeHtml(currentUser.firstName)} ${escapeHtml(currentUser.lastName)}</strong><span>${escapeHtml(currentUser.email)}</span></div>
        <span class="harmonia-role-badge">${escapeHtml(String(currentUser.role || "VIEWER").replaceAll("_", " "))}</span>
      </div>
      <form id="harmonia-profile-form" class="harmonia-account-form">
        <div class="harmonia-account-name-row">
          <label>First name<input name="firstName" value="${escapeHtml(currentUser.firstName)}" required></label>
          <label>Last name<input name="lastName" value="${escapeHtml(currentUser.lastName)}" required></label>
        </div>
        <button class="primary-button" type="submit">Save profile</button>
      </form>
      <div class="harmonia-account-profile-actions">
        ${destinationForRole(currentUser.role)
          ? `<a class="secondary-button" href="${destinationForRole(currentUser.role)}">Open Harmonia workspace</a>`
          : '<p class="harmonia-account-note">Your Viewer account is active. This account shows only work assigned directly to you.</p>'}
        <button type="button" class="text-link" id="harmonia-public-signout">Sign out</button>
      </div>
      ${destinationForRole(currentUser.role) ? "" : '<section id="harmonia-my-work" class="harmonia-my-work"></section>'}`;
    panel.querySelector("#harmonia-profile-form").onsubmit = updateProfile;
    panel.querySelector("#harmonia-public-signout").onclick = logout;
    if (!destinationForRole(currentUser.role)) loadMyWork();
  }

  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("Signing in…");
    try {
      const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: form.email.value, password: form.password.value }) });
      saveToken(result.accessToken, form.remember.checked);
      currentUser = await request("/users/me");
      updateButton();
      if (!routeAfterLogin()) {
        renderProfile();
        setMessage("Signed in.");
      }
    } catch (error) { setMessage(error.message, true); }
  }

  async function register(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("Creating your account…");
    try {
      const result = await request("/auth/register", { method: "POST", body: JSON.stringify({ firstName: form.firstName.value, lastName: form.lastName.value, email: form.email.value, password: form.password.value }) });
      saveToken(result.accessToken, true);
      currentUser = await request("/users/me");
      updateButton();
      renderProfile();
      setMessage("Your Viewer account is ready.");
    } catch (error) { setMessage(error.message, true); }
  }

  async function updateProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("Saving…");
    try {
      currentUser = await request("/users/me", { method: "PATCH", body: JSON.stringify({ firstName: form.firstName.value, lastName: form.lastName.value }) });
      updateButton();
      renderProfile();
      setMessage("Profile saved.");
    } catch (error) { setMessage(error.message, true); }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    currentUser = null;
    updateButton();
    showTab("login");
    setMessage("Signed out.");
  }

  function updateButton() {
    const button = document.getElementById("accountButton");
    if (!button) return;
    button.textContent = currentUser ? currentUser.firstName || "Account" : "Sign in";
  }

  async function openAccount() {
    buildModal();
    const overlay = document.getElementById("harmonia-account-overlay");
    overlay.hidden = false;
    if (currentUser) renderProfile(); else showTab("login");
  }

  async function initialize() {
    buildModal();
    document.getElementById("accountButton")?.addEventListener("click", openAccount);
    if (token()) {
      try { currentUser = await request("/users/me"); } catch { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); }
    }
    updateButton();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
