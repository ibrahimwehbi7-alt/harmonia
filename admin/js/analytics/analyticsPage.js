let activeAnalyticsSearch = "";
let activeAnalyticsCategoryFilter = "all";

function escapeAnalyticsHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getFilteredAnalyticsItems(items) {
    const search = activeAnalyticsSearch.trim().toLowerCase();

    return items.filter((item) => {
        const searchableText = Object.values(item).join(" ").toLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        const matchesCategory =
            activeAnalyticsCategoryFilter === "all" ||
            item.category === activeAnalyticsCategoryFilter;

        return matchesSearch && matchesCategory;
    });
}

function createAnalyticsCard(item) {
    const card = document.createElement("article");
    card.className = "harmonia:analytics-updated";

    card.innerHTML = `
      <div>
        <h3>${escapeAnalyticsHtml(item.name || "Untitled")}</h3>
        <p>${escapeAnalyticsHtml(item.period || item.notes || "No additional details.")}</p>
      </div>

      <div class="analytics-card-actions">
        <button class="text-button" type="button" data-analytics-edit="${escapeAnalyticsHtml(item.id)}">Edit</button>
        <button class="text-button danger" type="button" data-analytics-delete="${escapeAnalyticsHtml(item.id)}">Delete</button>
      </div>
    `;

    return card;
}

function renderAnalytics() {
    const list = document.getElementById("analyticsList");
    const emptyState = document.getElementById("analyticsEmptyState");

    if (!list || !window.HarmoniaAnalytics) return;

    const allItems = window.HarmoniaAnalytics.getAll();
    const filteredItems = getFilteredAnalyticsItems(allItems);

    list.innerHTML = "";
    filteredItems.forEach((item) => list.appendChild(createAnalyticsCard(item)));

    if (emptyState) emptyState.hidden = filteredItems.length > 0;
}

function initializeAnalyticsFilters() {
    const searchInput = document.getElementById("analyticsSearchInput");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeAnalyticsSearch = searchInput.value;
            renderAnalytics();
        });
    }

    
    const categoryFilter = document.getElementById("analyticsCategoryFilter");
    if (categoryFilter) {
        categoryFilter.addEventListener("change", () => {
            activeAnalyticsCategoryFilter = categoryFilter.value;
            renderAnalytics();
        });
    }
}

function initializeNewAnalyticsButton() {
    const button =
        document.getElementById("newMetricButton");

    if (!button || button.dataset.listenerAttached === "true") return;

    button.addEventListener("click", () => window.openAnalyticsModal?.());
    button.dataset.listenerAttached = "true";
}

function handleAnalyticsPageClick(event) {
    const editButton = event.target.closest("[data-analytics-edit]");
    if (editButton) {
        window.openAnalyticsModal?.(editButton.dataset.analyticsEdit);
        return;
    }

    const deleteButton = event.target.closest("[data-analytics-delete]");
    if (!deleteButton) return;

    const itemId = deleteButton.dataset.analyticsDelete;
    const item = window.HarmoniaAnalytics?.getById(itemId);
    if (!item) return;

    if (!window.confirm(`Delete "${item.name || "this item"}"?`)) return;

    window.HarmoniaAnalytics.delete(itemId);
}

function initializeAnalyticsPage() {
    initializeNewAnalyticsButton();
    initializeAnalyticsFilters();
    renderAnalytics();
}

document.addEventListener("click", handleAnalyticsPageClick);
document.addEventListener("analytics-card", renderAnalytics);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAnalyticsPage);
} else {
    initializeAnalyticsPage();
}

window.renderAnalytics = renderAnalytics;

console.log("✅ Analytics Page Loaded");