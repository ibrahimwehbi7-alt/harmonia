let activeMessagesSearch = "";
let activeMessagesStatusFilter = "all";
let activeMessagesTypeFilter = "all";

function escapeMessagesHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getFilteredMessagesItems(items) {
    const search = activeMessagesSearch.trim().toLowerCase();

    return items.filter((item) => {
        const searchableText = Object.values(item).join(" ").toLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        const matchesStatus =
            activeMessagesStatusFilter === "all" ||
            item.status === activeMessagesStatusFilter;
const matchesType =
            activeMessagesTypeFilter === "all" ||
            item.type === activeMessagesTypeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });
}

function createMessagesCard(item) {
    const card = document.createElement("article");
    card.className = "harmonia:messages-updated";

    card.innerHTML = `
      <div>
        <h3>${escapeMessagesHtml(item.subject || "Untitled")}</h3>
        <p>${escapeMessagesHtml(item.senderName || item.body || "No additional details.")}</p>
      </div>

      <div class="messages-card-actions">
        <button class="text-button" type="button" data-messages-edit="${escapeMessagesHtml(item.id)}">Edit</button>
        <button class="text-button danger" type="button" data-messages-delete="${escapeMessagesHtml(item.id)}">Delete</button>
      </div>
    `;

    return card;
}

function renderMessages() {
    const list = document.getElementById("messagesList");
    const emptyState = document.getElementById("messagesEmptyState");

    if (!list || !window.HarmoniaMessages) return;

    const allItems = window.HarmoniaMessages.getAll();
    const filteredItems = getFilteredMessagesItems(allItems);

    list.innerHTML = "";
    filteredItems.forEach((item) => list.appendChild(createMessagesCard(item)));

    if (emptyState) emptyState.hidden = filteredItems.length > 0;
}

function initializeMessagesFilters() {
    const searchInput = document.getElementById("messageSearchInput");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeMessagesSearch = searchInput.value;
            renderMessages();
        });
    }

    
    const statusFilter = document.getElementById("messageStatusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            activeMessagesStatusFilter = statusFilter.value;
            renderMessages();
        });
    }

    const typeFilter = document.getElementById("messageTypeFilter");
    if (typeFilter) {
        typeFilter.addEventListener("change", () => {
            activeMessagesTypeFilter = typeFilter.value;
            renderMessages();
        });
    }
}

function initializeNewMessagesButton() {
    const button =
        document.getElementById("newMessageButton");

    if (!button || button.dataset.listenerAttached === "true") return;

    button.addEventListener("click", () => window.openMessagesModal?.());
    button.dataset.listenerAttached = "true";
}

function handleMessagesPageClick(event) {
    const editButton = event.target.closest("[data-messages-edit]");
    if (editButton) {
        window.openMessagesModal?.(editButton.dataset.messagesEdit);
        return;
    }

    const deleteButton = event.target.closest("[data-messages-delete]");
    if (!deleteButton) return;

    const itemId = deleteButton.dataset.messagesDelete;
    const item = window.HarmoniaMessages?.getById(itemId);
    if (!item) return;

    if (!window.confirm(`Delete "${item.subject || "this item"}"?`)) return;

    window.HarmoniaMessages.delete(itemId);
}

function initializeMessagesPage() {
    initializeNewMessagesButton();
    initializeMessagesFilters();
    renderMessages();
}

document.addEventListener("click", handleMessagesPageClick);
document.addEventListener("message-card", renderMessages);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMessagesPage);
} else {
    initializeMessagesPage();
}

window.renderMessages = renderMessages;

console.log("✅ Messages Page Loaded");