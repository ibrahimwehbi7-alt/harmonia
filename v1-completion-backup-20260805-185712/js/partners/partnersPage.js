let activePartnersSearch = "";
let activePartnersTypeFilter = "all";
let activePartnersStatusFilter = "all";

function escapePartnersHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getFilteredPartnersItems(items) {
    const search = activePartnersSearch.trim().toLowerCase();

    return items.filter((item) => {
        const searchableText = Object.values(item).join(" ").toLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        const matchesType =
            activePartnersTypeFilter === "all" ||
            item.type === activePartnersTypeFilter;
const matchesStatus =
            activePartnersStatusFilter === "all" ||
            item.status === activePartnersStatusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });
}

function createPartnersCard(item) {
    const card = document.createElement("article");
    card.className = "harmonia:partners-updated";

    card.innerHTML = `
      <div>
        <h3>${escapePartnersHtml(item.name || "Untitled")}</h3>
        <p>${escapePartnersHtml(item.contactName || item.notes || "No additional details.")}</p>
      </div>

      <div class="partners-card-actions">
        <button class="text-button" type="button" data-partners-edit="${escapePartnersHtml(item.id)}">Edit</button>
        <button class="text-button danger" type="button" data-partners-delete="${escapePartnersHtml(item.id)}">Delete</button>
      </div>
    `;

    return card;
}

function renderPartners() {
    const list = document.getElementById("partnersList");
    const emptyState = document.getElementById("partnersEmptyState");

    if (!list || !window.HarmoniaPartners) return;

    const allItems = window.HarmoniaPartners.getAll();
    const filteredItems = getFilteredPartnersItems(allItems);

    list.innerHTML = "";
    filteredItems.forEach((item) => list.appendChild(createPartnersCard(item)));

    if (emptyState) emptyState.hidden = filteredItems.length > 0;
}

function initializePartnersFilters() {
    const searchInput = document.getElementById("partnerSearchInput");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activePartnersSearch = searchInput.value;
            renderPartners();
        });
    }

    
    const typeFilter = document.getElementById("partnerTypeFilter");
    if (typeFilter) {
        typeFilter.addEventListener("change", () => {
            activePartnersTypeFilter = typeFilter.value;
            renderPartners();
        });
    }

    const statusFilter = document.getElementById("partnerStatusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            activePartnersStatusFilter = statusFilter.value;
            renderPartners();
        });
    }
}

function initializeNewPartnersButton() {
    const button =
        document.getElementById("newPartnerButton");

    if (!button || button.dataset.listenerAttached === "true") return;

    button.addEventListener("click", () => window.openPartnersModal?.());
    button.dataset.listenerAttached = "true";
}

function handlePartnersPageClick(event) {
    const editButton = event.target.closest("[data-partners-edit]");
    if (editButton) {
        window.openPartnersModal?.(editButton.dataset.partnersEdit);
        return;
    }

    const deleteButton = event.target.closest("[data-partners-delete]");
    if (!deleteButton) return;

    const itemId = deleteButton.dataset.partnersDelete;
    const item = window.HarmoniaPartners?.getById(itemId);
    if (!item) return;

    if (!window.confirm(`Delete "${item.name || "this item"}"?`)) return;

    window.HarmoniaPartners.delete(itemId);
}

function initializePartnersPage() {
    initializeNewPartnersButton();
    initializePartnersFilters();
    renderPartners();
}

document.addEventListener("click", handlePartnersPageClick);
document.addEventListener("partner-card", renderPartners);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePartnersPage);
} else {
    initializePartnersPage();
}

window.renderPartners = renderPartners;

console.log("✅ Partners Page Loaded");