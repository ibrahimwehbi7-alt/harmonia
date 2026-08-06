const FINANCE_STORAGE_KEY = "harmonia_finance";

function loadFinance() {
    try {
        const savedItems = localStorage.getItem(FINANCE_STORAGE_KEY);
        if (!savedItems) return [];
        const parsedItems = JSON.parse(savedItems);
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        console.error("Could not load finance:", error);
        return [];
    }
}

function saveFinance(items) {
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("harmonia:finance-updated"));
}

function createFinanceId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `finance-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeFinanceItem(data = {}) {
    const timestamp = new Date().toISOString();

    return {
        id: data.id || createFinanceId(),

        title: String(data.title || "").trim(),
        kind: String(data.kind || "expense").trim(),
        status: String(data.status || "planned").trim(),
        amount: Number(data.amount || 0),
        date: String(data.date || "").trim(),
        organization: String(data.organization || "").trim(),
        category: String(data.category || "").trim(),
        project: String(data.project || "").trim(),
        reference: String(data.reference || "").trim(),
        notes: String(data.notes || "").trim(),

        createdAt: data.createdAt || timestamp,
        updatedAt: timestamp
    };
}

function getAllFinanceItems() {
    return loadFinance();
}

function getFinanceItemById(itemId) {
    return loadFinance().find((item) => item.id === itemId) || null;
}

function createFinanceItem(data) {
    const items = loadFinance();
    const newItem = normalizeFinanceItem(data);
    items.unshift(newItem);
    saveFinance(items);
    return newItem;
}

function updateFinanceItem(itemId, data) {
    const items = loadFinance();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) return null;

    const currentItem = items[itemIndex];
    const updatedItem = normalizeFinanceItem({
        ...currentItem,
        ...data,
        id: currentItem.id,
        createdAt: currentItem.createdAt
    });

    items[itemIndex] = updatedItem;
    saveFinance(items);
    return updatedItem;
}

function deleteFinanceItem(itemId) {
    const items = loadFinance();
    const filteredItems = items.filter((item) => item.id !== itemId);

    if (filteredItems.length === items.length) return false;

    saveFinance(filteredItems);
    return true;
}

window.HarmoniaFinance = {
    load: getAllFinanceItems,
    getAll: getAllFinanceItems,
    getById: getFinanceItemById,
    create: createFinanceItem,
    update: updateFinanceItem,
    delete: deleteFinanceItem
};

console.log("✅ Finance Manager Loaded");