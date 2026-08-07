(function () {
  "use strict";

  const TOKEN_KEY = "harmonia_access_token";
  const API = String(window.HARMONIA_CONFIG?.apiBaseUrl || "").replace(/\/+$/, "");
  const SITE_SLUG = "the-harmonia-project";
  const INTERESTS = [
    ["community-events", "Community events"],
    ["arts-culture", "Arts and culture"],
    ["civic-dialogue", "Civic conversations"],
    ["volunteering", "Volunteer opportunities"]
  ];
  let currentUser = null;
  let memberEvents = [];
  let assignedWork = [];

  function token() { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ""; }
  function saveToken(value, remember = true) {
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, value);
  }
  async function request(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (options.body) headers["Content-Type"] = "application/json";
    const accessToken = token(); if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: "omit" });
    const text = await response.text(); let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      const raw = data?.message || data?.error || `Request failed (${response.status})`;
      throw new Error(Array.isArray(raw) ? raw.join(" ") : String(raw));
    }
    return data;
  }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]); }
  function destinationForRole(role) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/#dashboard";
    if (role === "TEAM_MEMBER") return "/admin/#work";
    return "";
  }
  function formatEventDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date coming soon";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
  }

  function buildModal() {
    if (document.getElementById("harmonia-account-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "harmonia-account-overlay"; overlay.hidden = true;
    overlay.innerHTML = `
      <section class="harmonia-account-card" role="dialog" aria-modal="true" aria-labelledby="harmonia-account-title">
        <button class="harmonia-account-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">Harmonia Community</p>
        <h2 id="harmonia-account-title">Welcome</h2>
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
          <label class="harmonia-account-check"><input type="checkbox" name="newsletterOptIn"> Send me occasional event and newsletter updates</label>
          <p class="harmonia-account-note">Joining creates a simple member account. You can explore at your own pace.</p>
          <button class="primary-button" type="submit">Create account</button>
        </form>
        <div id="harmonia-profile-panel" hidden></div>
        <p id="harmonia-account-message" class="harmonia-account-message" aria-live="polite"></p>
      </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".harmonia-account-close").onclick = () => { overlay.hidden = true; };
    overlay.addEventListener("click", event => { if (event.target === overlay) overlay.hidden = true; });
    overlay.querySelectorAll("[data-account-tab]").forEach(button => button.onclick = () => showTab(button.dataset.accountTab));
    overlay.querySelector("#harmonia-login-form").addEventListener("submit", login);
    overlay.querySelector("#harmonia-register-form").addEventListener("submit", register);
  }
  function setMessage(message, error = false) {
    const box = document.getElementById("harmonia-account-message"); if (!box) return;
    box.textContent = message || ""; box.classList.toggle("error", error);
  }
  function showTab(tab) {
    document.querySelectorAll("[data-account-tab]").forEach(button => button.classList.toggle("active", button.dataset.accountTab === tab));
    document.getElementById("harmonia-login-form").hidden = tab !== "login";
    document.getElementById("harmonia-register-form").hidden = tab !== "register";
    document.getElementById("harmonia-profile-panel").hidden = true;
    document.querySelector("[data-account-tabs]").hidden = false; setMessage("");
  }

  async function loadMemberData() {
    const [eventsResult, tasksResult] = await Promise.allSettled([
      fetch(`${API}/public/site/${SITE_SLUG}/events?limit=4`, { headers: { Accept: "application/json" } }).then(response => response.ok ? response.json() : []),
      request("/tasks")
    ]);
    memberEvents = eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value) ? eventsResult.value : [];
    const tasks = tasksResult.status === "fulfilled" && Array.isArray(tasksResult.value) ? tasksResult.value : [];
    assignedWork = tasks.filter(task => task?.assignedTo?.id === currentUser.id || task?.assignedToId === currentUser.id);
  }

  function renderEventCards() {
    if (!memberEvents.length) return `<div class="member-empty-soft"><strong>New gatherings are coming soon.</strong><span>We will share them here when they are ready.</span></div>`;
    return `<div class="member-event-list">${memberEvents.slice(0, 3).map(event => `
      <article class="member-event-card">
        <span>${escapeHtml(formatEventDate(event.startAt))}</span>
        <strong>${escapeHtml(event.title)}</strong>
        ${event.registrationUrl ? `<a href="${escapeHtml(event.registrationUrl)}" target="_blank" rel="noopener">Learn more</a>` : ""}
      </article>`).join("")}</div>`;
  }

  function renderMemberSection(section = "home") {
    const content = document.getElementById("memberPortalContent"); if (!content) return;
    document.querySelectorAll("[data-member-section]").forEach(button => button.classList.toggle("active", button.dataset.memberSection === section));
    if (section === "events") {
      content.innerHTML = `<section class="member-panel"><p class="eyebrow">Upcoming</p><h3>Gather with us</h3>${renderEventCards()}</section>`;
      return;
    }
    if (section === "profile") {
      const selected = new Set(currentUser.interests || []);
      content.innerHTML = `<section class="member-panel">
        <p class="eyebrow">Your preferences</p><h3>Choose what feels relevant</h3>
        <form id="memberPreferencesForm" class="member-preferences-form">
          <div class="member-interest-grid">${INTERESTS.map(([value,label]) => `<label><input type="checkbox" name="interests" value="${value}" ${selected.has(value) ? "checked" : ""}> ${label}</label>`).join("")}</div>
          <label class="harmonia-account-check"><input type="checkbox" name="newsletterOptIn" ${currentUser.newsletterOptIn ? "checked" : ""}> Send me Harmonia's newsletter and event announcements</label>
          <div class="harmonia-account-name-row"><label>First name<input name="firstName" value="${escapeHtml(currentUser.firstName)}" required></label><label>Last name<input name="lastName" value="${escapeHtml(currentUser.lastName)}" required></label></div>
          <button class="primary-button" type="submit">Save preferences</button>
        </form>
      </section>`;
      content.querySelector("#memberPreferencesForm").onsubmit = updateProfile;
      return;
    }
    content.innerHTML = `<section class="member-welcome">
      <span class="member-kicker">Welcome, ${escapeHtml(currentUser.firstName)}</span>
      <h3>Explore at your own pace.</h3>
      <p>See what is happening, save what interests you, and become more involved whenever it feels right.</p>
      <button type="button" class="primary-button" data-open-member-events>Explore upcoming events</button>
    </section>
    ${assignedWork.length ? `<section class="member-panel member-commitments"><p class="eyebrow">My commitments</p><h3>Work you accepted</h3><div class="member-work-list">${assignedWork.map(task => `<article><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.project?.name || "Harmonia")}</span></article>`).join("")}</div></section>` : ""}
    <section class="member-panel"><p class="eyebrow">A gentle next step</p><h3>Stay connected</h3><p>Choose the topics you care about and we will only send relevant updates.</p><button type="button" class="secondary-button" data-open-member-profile>Update my interests</button></section>`;
    content.querySelector("[data-open-member-events]").onclick = () => renderMemberSection("events");
    content.querySelector("[data-open-member-profile]").onclick = () => renderMemberSection("profile");
  }

  async function renderProfile() {
    const tabs = document.querySelector("[data-account-tabs]");
    const panel = document.getElementById("harmonia-profile-panel");
    tabs.hidden = true; document.getElementById("harmonia-login-form").hidden = true; document.getElementById("harmonia-register-form").hidden = true; panel.hidden = false;
    const destination = destinationForRole(currentUser.role);
    if (destination) {
      panel.innerHTML = `<div class="harmonia-account-profile-head"><div><strong>${escapeHtml(currentUser.firstName)} ${escapeHtml(currentUser.lastName)}</strong><span>${escapeHtml(currentUser.email)}</span></div><span class="harmonia-role-badge">${escapeHtml(String(currentUser.role).replaceAll("_", " "))}</span></div><div class="harmonia-account-profile-actions"><a class="primary-button" href="${destination}">Open Harmonia workspace</a><button type="button" class="text-link" id="harmonia-public-signout">Sign out</button></div>`;
      panel.querySelector("#harmonia-public-signout").onclick = logout; return;
    }
    panel.innerHTML = `<div class="member-portal-shell"><div class="member-portal-head"><div><span>Harmonia Member</span><strong>${escapeHtml(currentUser.firstName)} ${escapeHtml(currentUser.lastName)}</strong></div><button type="button" class="text-link" id="harmonia-public-signout">Sign out</button></div><nav class="member-portal-nav"><button type="button" data-member-section="home" class="active">Home</button><button type="button" data-member-section="events">Events</button><button type="button" data-member-section="profile">Profile</button></nav><div id="memberPortalContent"></div></div>`;
    panel.querySelector("#harmonia-public-signout").onclick = logout;
    panel.querySelectorAll("[data-member-section]").forEach(button => button.onclick = () => renderMemberSection(button.dataset.memberSection));
    await loadMemberData(); renderMemberSection("home");
  }

  async function login(event) {
    event.preventDefault(); const form = event.currentTarget; setMessage("Signing in…");
    try {
      const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: form.email.value, password: form.password.value }) });
      saveToken(result.accessToken, form.remember.checked); currentUser = await request("/users/me"); updateButton();
      const destination = destinationForRole(currentUser.role);
      if (destination) { setMessage("Opening your Harmonia workspace…"); return window.setTimeout(() => window.location.assign(destination), 250); }
      await renderProfile(); setMessage("");
    } catch (error) { setMessage(error.message, true); }
  }
  async function register(event) {
    event.preventDefault(); const form = event.currentTarget; setMessage("Creating your account…");
    try {
      const result = await request("/auth/register", { method: "POST", body: JSON.stringify({ firstName: form.firstName.value, lastName: form.lastName.value, email: form.email.value, password: form.password.value }) });
      saveToken(result.accessToken, true); currentUser = await request("/users/me");
      if (form.newsletterOptIn.checked) currentUser = await request("/users/me", { method: "PATCH", body: JSON.stringify({ newsletterOptIn: true }) });
      updateButton(); await renderProfile(); setMessage("");
    } catch (error) { setMessage(error.message, true); }
  }
  async function updateProfile(event) {
    event.preventDefault(); const form = event.currentTarget; setMessage("Saving…");
    const interests = [...form.querySelectorAll('input[name="interests"]:checked')].map(input => input.value);
    try {
      currentUser = await request("/users/me", { method: "PATCH", body: JSON.stringify({ firstName: form.firstName.value, lastName: form.lastName.value, newsletterOptIn: form.newsletterOptIn.checked, interests }) });
      updateButton(); renderMemberSection("profile"); setMessage("Saved.");
    } catch (error) { setMessage(error.message, true); }
  }
  function logout() { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); currentUser = null; updateButton(); showTab("login"); setMessage("Signed out."); }
  function updateButton() { const button = document.getElementById("accountButton"); if (button) button.textContent = currentUser ? currentUser.firstName || "Account" : "Sign in"; }
  async function openAccount() { buildModal(); document.getElementById("harmonia-account-overlay").hidden = false; if (currentUser) await renderProfile(); else showTab("login"); }
  async function initialize() {
    buildModal(); document.getElementById("accountButton")?.addEventListener("click", openAccount);
    if (token()) { try { currentUser = await request("/users/me"); } catch { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } }
    updateButton();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true }); else initialize();
})();
