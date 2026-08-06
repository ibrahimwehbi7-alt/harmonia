(function () {
  "use strict";
  let users = [];

  function isAdmin() {
    return ["ADMIN", "SUPER_ADMIN"].includes(window.HarmoniaAuth?.getCurrentUser()?.role);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
  }

  async function load(search = "") {
    if (!isAdmin()) return;
    const suffix = search ? `?search=${encodeURIComponent(search)}` : "";
    users = await window.HarmoniaApi.request(`/users${suffix}`);
    render();
  }

  function render() {
    const body = document.getElementById("usersTableBody");
    const empty = document.getElementById("usersEmptyState");
    if (!body) return;
    body.innerHTML = users.map(user => `
      <tr>
        <td><strong>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</strong><small>${escapeHtml(user.email)}</small></td>
        <td>${escapeHtml(user.memberships?.map(m => m.organization?.name).filter(Boolean).join(", ") || "—")}</td>
        <td><select data-user-role="${escapeHtml(user.id)}" ${user.role === "SUPER_ADMIN" && window.HarmoniaAuth?.getCurrentUser()?.role !== "SUPER_ADMIN" ? "disabled" : ""}>
          ${["VIEWER","TEAM_MEMBER","ADMIN","SUPER_ADMIN"].map(role => `<option value="${role}" ${role === user.role ? "selected" : ""}>${role.replaceAll("_", " ")}</option>`).join("")}
        </select></td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      </tr>`).join("");
    empty.hidden = users.length > 0;
    body.querySelectorAll("[data-user-role]").forEach(select => select.onchange = async () => {
      const original = users.find(u => u.id === select.dataset.userRole)?.role;
      select.disabled = true;
      try {
        await window.HarmoniaApi.request(`/users/${select.dataset.userRole}/role`, { method: "PATCH", body: JSON.stringify({ role: select.value }) });
        await load(document.getElementById("usersSearch")?.value || "");
      } catch (error) {
        alert(error.message || "Could not update this role.");
        select.value = original;
        select.disabled = false;
      }
    });
  }

  async function initializeUsersPage() {
    const page = document.getElementById("users");
    const nav = document.querySelector('[data-page="users"]');
    if (!page || !nav) return;
    const allowed = isAdmin();
    nav.hidden = !allowed;
    if (!allowed) return;
    const search = document.getElementById("usersSearch");
    let timer;
    search?.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => load(search.value).catch(console.error), 250); });
    await load();
  }

  window.initializeUsersPage = initializeUsersPage;
  window.renderUsersPage = () => load(document.getElementById("usersSearch")?.value || "");
  console.log("✅ Users Page Loaded");
})();
