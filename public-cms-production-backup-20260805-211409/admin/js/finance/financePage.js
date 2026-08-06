let activeFinanceSearch = "";
let activeFinanceKindFilter = "all";
let activeFinanceStatusFilter = "all";

function escapeFinanceHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getFilteredFinanceItems(items) {
    const search = activeFinanceSearch.trim().toLowerCase();

    return items.filter((item) => {
        const searchableText = Object.values(item).join(" ").toLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        const matchesKind =
            activeFinanceKindFilter === "all" ||
            item.kind === activeFinanceKindFilter;
const matchesStatus =
            activeFinanceStatusFilter === "all" ||
            item.status === activeFinanceStatusFilter;

        return matchesSearch && matchesKind && matchesStatus;
    });
}

function createFinanceCard(item) {
    const card = document.createElement("article");
    card.className = "harmonia:finance-updated";

    card.innerHTML = `
      <div>
        <h3>${escapeFinanceHtml(item.title || "Untitled")}</h3>
        <p>${escapeFinanceHtml(item.organization || item.notes || "No additional details.")}</p>
      </div>

      <div class="finance-card-actions">
        <button class="text-button" type="button" data-finance-edit="${escapeFinanceHtml(item.id)}">Edit</button>
        <button class="text-button danger" type="button" data-finance-delete="${escapeFinanceHtml(item.id)}">Delete</button>
      </div>
    `;

    return card;
}

function renderFinance() {
    const list = document.getElementById("financeList");
    const emptyState = document.getElementById("financeEmptyState");

    if (!list || !window.HarmoniaFinance) return;

    const allItems = window.HarmoniaFinance.getAll();
    const filteredItems = getFilteredFinanceItems(allItems);

    list.innerHTML = "";
    filteredItems.forEach((item) => list.appendChild(createFinanceCard(item)));

    if (emptyState) emptyState.hidden = filteredItems.length > 0;
}

function initializeFinanceFilters() {
    const searchInput = document.getElementById("financeSearchInput");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeFinanceSearch = searchInput.value;
            renderFinance();
        });
    }

    
    const kindFilter = document.getElementById("financeKindFilter");
    if (kindFilter) {
        kindFilter.addEventListener("change", () => {
            activeFinanceKindFilter = kindFilter.value;
            renderFinance();
        });
    }

    const statusFilter = document.getElementById("financeStatusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            activeFinanceStatusFilter = statusFilter.value;
            renderFinance();
        });
    }
}

function initializeNewFinanceButton() {
    const button =
        document.getElementById("newFinanceButton") ||
        document.getElementById("newTransactionButton");

    if (!button || button.dataset.listenerAttached === "true") return;

    button.addEventListener("click", () => window.openFinanceModal?.());
    button.dataset.listenerAttached = "true";
}

function handleFinancePageClick(event) {
    const editButton = event.target.closest("[data-finance-edit]");
    if (editButton) {
        window.openFinanceModal?.(editButton.dataset.financeEdit);
        return;
    }

    const deleteButton = event.target.closest("[data-finance-delete]");
    if (!deleteButton) return;

    const itemId = deleteButton.dataset.financeDelete;
    const item = window.HarmoniaFinance?.getById(itemId);
    if (!item) return;

    if (!window.confirm(`Delete "${item.title || "this item"}"?`)) return;

    window.HarmoniaFinance.delete(itemId);
}

function initializeFinancePage() {
    initializeNewFinanceButton();
    initializeFinanceFilters();
    renderFinance();
}

document.addEventListener("click", handleFinancePageClick);
document.addEventListener("finance-card", renderFinance);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeFinancePage);
} else {
    initializeFinancePage();
}

window.renderFinance = renderFinance;

console.log("✅ Finance Page Loaded");